"""
FAAZO – Payment Views

Three endpoints:
  POST /api/v1/payments/create-order/  → Create Razorpay order
  POST /api/v1/payments/verify/        → Verify payment & create Order
  POST /api/v1/payments/webhook/       → Razorpay webhook receiver
"""

import json
import logging
import uuid
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.cart.models import Cart
from apps.checkout.views import calculate_checkout_pricing, is_valid_uuid
from apps.common.responses import error_response, success_response
from apps.inventory.models import ProductInventory
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.products.models import Product
from apps.users.models import Address

from .models import Payment, PaymentStatus, WebhookEvent
from . import services as razorpay_service

logger = logging.getLogger("faazo.payments")


def _resolve_cart_items(user, items_data):
    """
    Resolve cart items from either explicit items list (buy-now)
    or the user's database cart.

    Returns:
        (cart_items, is_buy_now, error_response_or_none)
    """

    class DummyItem:
        def __init__(self, product, quantity):
            self.product = product
            self.quantity = quantity

    if items_data:
        cart_items = []
        for item in items_data:
            prod_id = item.get("product_id")
            qty = int(item.get("quantity", 1))
            if is_valid_uuid(prod_id):
                product = Product.objects.filter(id=prod_id).first()
            else:
                product = Product.objects.filter(slug=prod_id).first()
            if not product:
                return None, True, error_response(
                    f"Product '{prod_id}' not found.",
                    status_code=status.HTTP_404_NOT_FOUND,
                )
            cart_items.append(DummyItem(product, qty))
        return cart_items, True, None
    else:
        try:
            cart = Cart.objects.get(user=user)
            cart_items = list(cart.items.select_related("product", "product__pricing").all())
        except Cart.DoesNotExist:
            cart_items = []
        return cart_items, False, None


def _validate_inventory(cart_items):
    """Check stock availability for all items. Returns error response or None."""
    for item in cart_items:
        inventory = getattr(item.product, "inventory", None)
        if inventory and not inventory.allow_backorders and item.quantity > inventory.available_stock:
            return error_response(
                f"Insufficient stock for '{item.product.name}'. Max {inventory.available_stock}.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
    return None


class CreatePaymentOrderView(APIView):
    """
    POST /api/v1/payments/create-order/

    Validates cart, calculates pricing, creates a Razorpay order,
    and stores a Payment record with status 'created'.

    Returns the Razorpay order details needed by the frontend to
    open the checkout modal.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Check purchase permission (dealers must be approved)
        if hasattr(user, "can_purchase") and not user.can_purchase:
            return error_response(
                "Your account is not authorised to make purchases.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        address_id = request.data.get("address_id")
        delivery_method = request.data.get("delivery_method", "standard")
        payment_method = request.data.get("payment_method", "razorpay")
        gst_number = request.data.get("gst_number")
        items_data = request.data.get("items")

        if not address_id:
            return error_response("address_id is required.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            address = Address.objects.get(pk=address_id, user=user)
        except (Address.DoesNotExist, ValueError):
            return error_response(
                "Selected shipping address was not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        # Resolve cart items
        cart_items, is_buy_now, err = _resolve_cart_items(user, items_data)
        if err:
            return err
        if not cart_items:
            return error_response("Your checkout queue is empty.", status_code=status.HTTP_400_BAD_REQUEST)

        # Validate inventory
        inv_err = _validate_inventory(cart_items)
        if inv_err:
            return inv_err

        # Calculate pricing using existing checkout logic
        pricing = calculate_checkout_pricing(user, cart_items, delivery_method)
        total_amount = Decimal(str(pricing["total_amount"]))

        if total_amount <= 0:
            return error_response("Invalid order total.", status_code=status.HTTP_400_BAD_REQUEST)

        # Generate idempotency key from user + cart contents + address
        item_fingerprint = "|".join(
            f"{getattr(item.product, 'id', '')}:{item.quantity}" for item in cart_items
        )
        idempotency_key = f"{user.id}:{address_id}:{delivery_method}:{item_fingerprint}"

        # Check for existing non-failed payment with same idempotency key
        existing = Payment.objects.filter(
            idempotency_key=idempotency_key,
            status=PaymentStatus.CREATED,
        ).first()

        if existing:
            # Return the existing Razorpay order (idempotent)
            logger.info("Returning existing payment order: %s", existing.razorpay_order_id)
            return success_response(
                data={
                    "razorpay_order_id": existing.razorpay_order_id,
                    "amount": int(existing.amount * 100),
                    "currency": existing.currency,
                    "key_id": settings.RAZORPAY_KEY_ID,
                    "payment_id": str(existing.id),
                },
                message="Payment order already exists.",
            )

        # Create Razorpay order
        amount_paise = int(total_amount * 100)
        receipt = f"faazo_{uuid.uuid4().hex[:12]}"

        try:
            rz_order = razorpay_service.create_razorpay_order(
                amount_paise=amount_paise,
                receipt=receipt,
                notes={
                    "user_id": str(user.id),
                    "user_email": user.email,
                    "address_id": str(address_id),
                },
            )
        except Exception as e:
            logger.error("Razorpay order creation failed: %s", e)
            return error_response(
                "Payment gateway error. Please try again.",
                status_code=status.HTTP_502_BAD_GATEWAY,
            )

        # Snapshot checkout data for later order creation
        checkout_snapshot = {
            "address_id": str(address_id),
            "delivery_method": delivery_method,
            "payment_method": payment_method,
            "gst_number": gst_number,
            "is_buy_now": is_buy_now,
            "items": [
                {"product_id": str(item.product.id), "quantity": item.quantity}
                for item in cart_items
            ],
            "pricing": pricing,
        }

        # Save payment record
        payment = Payment.objects.create(
            user=user,
            razorpay_order_id=rz_order["id"],
            amount=total_amount,
            currency="INR",
            status=PaymentStatus.CREATED,
            payment_method=payment_method,
            idempotency_key=idempotency_key,
            checkout_data=checkout_snapshot,
            gateway_response=rz_order,
        )

        # Save clinic GST number if provided
        if gst_number and hasattr(user, "profile"):
            profile = user.profile
            profile.gst_number = gst_number
            profile.save()

        logger.info(
            "Payment order created: payment=%s razorpay_order=%s amount=₹%s",
            payment.id,
            rz_order["id"],
            total_amount,
        )

        return success_response(
            data={
                "razorpay_order_id": rz_order["id"],
                "amount": amount_paise,
                "currency": "INR",
                "key_id": settings.RAZORPAY_KEY_ID,
                "payment_id": str(payment.id),
            },
            message="Payment order created. Proceed to payment.",
        )


class VerifyPaymentView(APIView):
    """
    POST /api/v1/payments/verify/

    Verifies the Razorpay payment signature, creates the Order,
    reserves inventory, and clears the cart.

    This is the ONLY endpoint that creates Orders — never bypass it.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        razorpay_order_id = request.data.get("razorpay_order_id", "").strip()
        razorpay_payment_id = request.data.get("razorpay_payment_id", "").strip()
        razorpay_signature = request.data.get("razorpay_signature", "").strip()
        payment_id = request.data.get("payment_id", "").strip()

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id]):
            return error_response(
                "Missing required payment verification fields.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                # Lock the payment row to prevent race conditions
                payment = (
                    Payment.objects.select_for_update()
                    .filter(id=payment_id, user=user, razorpay_order_id=razorpay_order_id)
                    .first()
                )

                if not payment:
                    return error_response(
                        "Payment record not found.",
                        status_code=status.HTTP_404_NOT_FOUND,
                    )

                # Prevent duplicate verification
                if payment.status == PaymentStatus.CAPTURED:
                    logger.warning("Duplicate verification attempt: %s", payment.razorpay_order_id)
                    # Return existing order data
                    if payment.order:
                        return success_response(
                            data=self._build_order_response(payment.order, payment),
                            message="Payment already verified. Order exists.",
                        )
                    return error_response(
                        "Payment already processed.",
                        status_code=status.HTTP_409_CONFLICT,
                    )

                if payment.status != PaymentStatus.CREATED:
                    return error_response(
                        f"Payment is in '{payment.status}' state and cannot be verified.",
                        status_code=status.HTTP_400_BAD_REQUEST,
                    )

                # Verify signature
                is_valid = razorpay_service.verify_payment_signature(
                    razorpay_order_id, razorpay_payment_id, razorpay_signature
                )

                if not is_valid:
                    payment.status = PaymentStatus.FAILED
                    payment.razorpay_payment_id = razorpay_payment_id
                    payment.error_code = "SIGNATURE_VERIFICATION_FAILED"
                    payment.error_description = "Payment signature verification failed."
                    payment.save()
                    logger.warning("Signature verification failed for payment %s", payment.id)
                    return error_response(
                        "Payment verification failed. Please contact support.",
                        status_code=status.HTTP_400_BAD_REQUEST,
                    )

                # Validate amount hasn't been tampered
                # (Razorpay order amount is in paise)
                expected_paise = int(payment.amount * 100)
                rz_order_amount = payment.gateway_response.get("amount", 0)
                if expected_paise != rz_order_amount:
                    payment.status = PaymentStatus.FAILED
                    payment.error_code = "AMOUNT_MISMATCH"
                    payment.error_description = (
                        f"Expected {expected_paise} paise, got {rz_order_amount} paise."
                    )
                    payment.save()
                    logger.error(
                        "Amount mismatch for payment %s: expected=%d got=%d",
                        payment.id, expected_paise, rz_order_amount,
                    )
                    return error_response(
                        "Payment amount mismatch detected.",
                        status_code=status.HTTP_400_BAD_REQUEST,
                    )

                # Fetch payment details from Razorpay for audit
                rz_payment_details = razorpay_service.fetch_payment_details(razorpay_payment_id)

                # Recreate order from checkout snapshot
                checkout = payment.checkout_data
                address = Address.objects.get(pk=checkout["address_id"], user=user)
                pricing = checkout["pricing"]

                order = Order.objects.create(
                    user=user,
                    shipping_address=address,
                    status=OrderStatus.PROCESSING,
                    payment_method=checkout.get("payment_method", "razorpay"),
                    mrp_subtotal=Decimal(str(pricing["mrp_subtotal"])),
                    selling_subtotal=Decimal(str(pricing["selling_subtotal"])),
                    gst_amount=Decimal(str(pricing["gst_amount"])),
                    shipping_fee=Decimal(str(pricing["shipping_fee"])),
                    total_amount=Decimal(str(pricing["total_amount"])),
                )

                # Record initial status in history
                from apps.orders.models import OrderStatusHistory
                OrderStatusHistory.objects.create(
                    order=order,
                    status=OrderStatus.PROCESSING,
                    changed_by=user,
                    notes="Order placed successfully after online payment verification."
                )

                # Create order items and reserve inventory
                for item_data in checkout["items"]:
                    product = Product.objects.get(id=item_data["product_id"])
                    pricing_obj = getattr(product, "pricing", None)

                    if pricing_obj:
                        price = (
                            pricing_obj.dealer_price
                            if (
                                user.role == "dealer"
                                and user.dealer_status == "approved"
                                and pricing_obj.dealer_price is not None
                            )
                            else pricing_obj.effective_price
                        )
                    else:
                        price = Decimal("0.00")

                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=item_data["quantity"],
                        price=price,
                    )

                    # Reserve inventory
                    inventory = getattr(product, "inventory", None)
                    if inventory:
                        inventory.reserved_stock += item_data["quantity"]
                        inventory.save()

                # Clear cart (only for cart-based checkout, not buy-now)
                if not checkout.get("is_buy_now", False):
                    try:
                        Cart.objects.get(user=user).items.all().delete()
                    except Cart.DoesNotExist:
                        pass

                # Update payment record
                payment.status = PaymentStatus.CAPTURED
                payment.razorpay_payment_id = razorpay_payment_id
                payment.razorpay_signature = razorpay_signature
                payment.order = order
                payment.verified_at = timezone.now()
                payment.gateway_response = rz_payment_details or payment.gateway_response
                payment.save()

                logger.info(
                    "Payment verified & order created: payment=%s order=%s",
                    payment.id,
                    order.id,
                )

                return success_response(
                    data=self._build_order_response(order, payment),
                    message="Payment verified. Order placed successfully.",
                )

        except Address.DoesNotExist:
            return error_response(
                "Shipping address no longer exists.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        except Product.DoesNotExist:
            return error_response(
                "One or more products are no longer available.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.exception("Payment verification error: %s", e)
            return error_response(
                "Payment verification failed due to a server error.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _build_order_response(self, order, payment):
        """Build the order response matching the frontend's expected shape."""
        address = order.shipping_address
        checkout = payment.checkout_data
        pricing = checkout.get("pricing", {})

        items_serialized = []
        for order_item in order.items.select_related("product", "product__category").all():
            primary_img = (
                order_item.product.images.filter(is_primary=True).first()
                or order_item.product.images.first()
            )
            items_serialized.append({
                "id": order_item.product.slug,
                "name": order_item.product.name,
                "category": order_item.product.category.name if order_item.product.category else "",
                "price": float(order_item.price),
                "qty": order_item.quantity,
                "image": primary_img.image.url if primary_img else "",
            })

        return {
            "id": str(order.id),
            "items": items_serialized,
            "address": {
                "id": str(address.id),
                "type": address.label,
                "dentist": address.full_name,
                "clinic": address.line1,
                "street": address.line2,
                "city": f"{address.city}, {address.state}",
                "pincode": address.pincode,
                "phone": address.mobile,
            },
            "paymentMethod": order.payment_method,
            "pricing": {
                "subtotal": pricing.get("selling_subtotal", float(order.selling_subtotal)),
                "shipping": pricing.get("shipping_fee", float(order.shipping_fee)),
                "gst": pricing.get("gst_amount", float(order.gst_amount)),
                "discount": pricing.get("savings", 0),
                "total": pricing.get("total_amount", float(order.total_amount)),
                "savings": pricing.get("savings", 0),
            },
        }


@method_decorator(csrf_exempt, name="dispatch")
class WebhookView(APIView):
    """
    POST /api/v1/payments/webhook/

    Receives Razorpay webhook events. CSRF-exempt because Razorpay
    calls this endpoint directly. Uses webhook signature verification
    for authentication.
    """

    permission_classes = [AllowAny]
    authentication_classes = []  # No JWT auth for webhooks

    def post(self, request):
        signature = request.META.get("HTTP_X_RAZORPAY_SIGNATURE", "")
        body = request.body

        if not signature:
            logger.warning("Webhook received without signature header.")
            return error_response(
                "Missing signature.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        # Verify webhook signature
        if not razorpay_service.verify_webhook_signature(body, signature):
            logger.warning("Webhook signature verification failed.")
            return error_response(
                "Invalid signature.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            return error_response(
                "Invalid JSON payload.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        event_type = payload.get("event", "")
        event_id = payload.get("account_id", "") + "_" + str(payload.get("created_at", ""))

        # Idempotent check — don't process same event twice
        if WebhookEvent.objects.filter(event_id=event_id).exists():
            logger.info("Duplicate webhook event ignored: %s", event_id)
            return success_response(message="Event already processed.")

        # Log the event
        webhook_event = WebhookEvent.objects.create(
            event_id=event_id,
            event_type=event_type,
            payload=payload,
        )

        # Process specific event types
        try:
            if event_type == "payment.captured":
                self._handle_payment_captured(payload)
            elif event_type == "payment.failed":
                self._handle_payment_failed(payload)
            elif event_type == "refund.created":
                self._handle_refund_created(payload)
            else:
                logger.info("Unhandled webhook event type: %s", event_type)

            webhook_event.processed = True
            webhook_event.save()

        except Exception as e:
            logger.exception("Webhook processing error: %s", e)
            webhook_event.processing_error = str(e)
            webhook_event.save()

        return success_response(message="Webhook received.")

    def _handle_payment_captured(self, payload):
        """Handle payment.captured webhook — update payment status if needed."""
        entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        rz_order_id = entity.get("order_id", "")

        if not rz_order_id:
            return

        payment = Payment.objects.filter(razorpay_order_id=rz_order_id).first()
        if payment and payment.status == PaymentStatus.CREATED:
            # This handles the case where the verify endpoint wasn't called
            # (e.g., network failure after payment). The webhook ensures
            # the payment record is updated.
            logger.info(
                "Webhook: marking payment %s as captured (was still 'created').",
                payment.id,
            )
            payment.status = PaymentStatus.CAPTURED
            payment.razorpay_payment_id = entity.get("id", "")
            payment.gateway_response = entity
            payment.save()

    def _handle_payment_failed(self, payload):
        """Handle payment.failed webhook — mark payment as failed."""
        entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        rz_order_id = entity.get("order_id", "")

        if not rz_order_id:
            return

        payment = Payment.objects.filter(razorpay_order_id=rz_order_id).first()
        if payment and payment.status == PaymentStatus.CREATED:
            payment.status = PaymentStatus.FAILED
            payment.razorpay_payment_id = entity.get("id", "")
            payment.error_code = entity.get("error_code", "")
            payment.error_description = entity.get("error_description", "")
            payment.gateway_response = entity
            payment.save()
            logger.info("Webhook: marked payment %s as failed.", payment.id)

    def _handle_refund_created(self, payload):
        """Handle refund.created webhook — update payment status."""
        entity = payload.get("payload", {}).get("refund", {}).get("entity", {})
        rz_payment_id = entity.get("payment_id", "")

        if not rz_payment_id:
            return

        payment = Payment.objects.filter(razorpay_payment_id=rz_payment_id).first()
        if payment:
            payment.status = PaymentStatus.REFUNDED
            payment.save()
            logger.info("Webhook: marked payment %s as refunded.", payment.id)
