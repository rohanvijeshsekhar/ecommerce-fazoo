import uuid
from decimal import Decimal
from django.db import models
from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from apps.common.responses import success_response, error_response
from apps.products.models import Product
from apps.users.models import Address
from apps.cart.models import Cart
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.inventory.models import ProductInventory

def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

# Helper pricing calculator
def calculate_checkout_pricing(user, cart_items, delivery_method):
    mrp_subtotal = Decimal("0.00")
    selling_subtotal = Decimal("0.00")
    gst_amount = Decimal("0.00")

    for item in cart_items:
        pricing = getattr(item.product, 'pricing', None)
        if pricing:
            mrp_subtotal += pricing.mrp * item.quantity
            price = pricing.dealer_price if (user.role == 'dealer' and user.dealer_status == 'approved' and pricing.dealer_price is not None) else pricing.effective_price
            selling_subtotal += price * item.quantity
            gst_rate = pricing.gst_percentage / Decimal("100.00")
            gst_amount += price * item.quantity * gst_rate

    delivery_fee = {
        'standard': Decimal("0.00"),
        'express': Decimal("1500.00"),
        'install': Decimal("3500.00"),
    }.get(delivery_method, Decimal("0.00"))

    savings = mrp_subtotal - selling_subtotal
    total_amount = selling_subtotal + gst_amount + delivery_fee

    return {
        "mrp_subtotal": float(round(mrp_subtotal, 2)),
        "selling_subtotal": float(round(selling_subtotal, 2)),
        "gst_amount": float(round(gst_amount, 2)),
        "shipping_fee": float(round(delivery_fee, 2)),
        "total_amount": float(round(total_amount, 2)),
        "savings": float(round(savings, 2))
    }

class CheckoutPreviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        address_id = request.data.get("address_id")
        delivery_method = request.data.get("delivery_method", "standard")

        if not address_id:
            return error_response("address_id is required.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            address = Address.objects.get(pk=address_id, user=request.user)
        except (Address.DoesNotExist, ValueError):
            return error_response("Selected shipping address was not found.", status_code=status.HTTP_404_NOT_FOUND)

        items_data = request.data.get("items")
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
                    return error_response(f"Product '{prod_id}' not found.", status_code=status.HTTP_404_NOT_FOUND)
                
                class DummyItem:
                    def __init__(self, product, quantity):
                        self.product = product
                        self.quantity = quantity
                cart_items.append(DummyItem(product, qty))
        else:
            try:
                cart = Cart.objects.get(user=request.user)
                cart_items = list(cart.items.all())
            except Cart.DoesNotExist:
                cart_items = []

        if not cart_items:
            return error_response("Your checkout queue is empty.", status_code=status.HTTP_400_BAD_REQUEST)

        # Inventory check
        for item in cart_items:
            inventory = getattr(item.product, 'inventory', None)
            if inventory and not inventory.allow_backorders and item.quantity > inventory.available_stock:
                return error_response(
                    f"Product '{item.product.name}' exceeds available stock. Limit is {inventory.available_stock}.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        pricing = calculate_checkout_pricing(request.user, cart_items, delivery_method)
        return success_response(data=pricing, message="Checkout pricing preview calculated.")

class CheckoutPlaceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        address_id = request.data.get("address_id")
        delivery_method = request.data.get("delivery_method", "standard")
        payment_method = request.data.get("payment_method", "upi")
        gst_number = request.data.get("gst_number")

        if not address_id:
            return error_response("address_id is required.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            address = Address.objects.get(pk=address_id, user=request.user)
        except (Address.DoesNotExist, ValueError):
            return error_response("Selected shipping address was not found.", status_code=status.HTTP_404_NOT_FOUND)

        # Save clinic GST number if provided during checkout
        if gst_number and hasattr(request.user, 'profile'):
            profile = request.user.profile
            profile.gst_number = gst_number
            profile.save()

        items_data = request.data.get("items")
        is_buy_now = False
        if items_data:
            is_buy_now = True
            cart_items = []
            for item in items_data:
                prod_id = item.get("product_id")
                qty = int(item.get("quantity", 1))
                if is_valid_uuid(prod_id):
                    product = Product.objects.filter(id=prod_id).first()
                else:
                    product = Product.objects.filter(slug=prod_id).first()
                if not product:
                    return error_response(f"Product '{prod_id}' not found.", status_code=status.HTTP_404_NOT_FOUND)
                
                class DummyItem:
                    def __init__(self, product, quantity):
                        self.product = product
                        self.quantity = quantity
                cart_items.append(DummyItem(product, qty))
        else:
            try:
                cart = Cart.objects.get(user=request.user)
                cart_items = list(cart.items.all())
            except Cart.DoesNotExist:
                cart_items = []

        if not cart_items:
            return error_response("Your checkout queue is empty.", status_code=status.HTTP_400_BAD_REQUEST)

        # Verify inventory and resolve final pricing block
        for item in cart_items:
            inventory = getattr(item.product, 'inventory', None)
            if inventory and not inventory.allow_backorders and item.quantity > inventory.available_stock:
                return error_response(
                    f"Insufficient stock for '{item.product.name}'. Max {inventory.available_stock}.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        pricing = calculate_checkout_pricing(request.user, cart_items, delivery_method)

        # Atomically place order, adjust stock, and clear cart
        try:
            with transaction.atomic():
                order = Order.objects.create(
                    user=request.user,
                    shipping_address=address,
                    status=OrderStatus.PROCESSING,
                    payment_method=payment_method,
                    mrp_subtotal=Decimal(str(pricing["mrp_subtotal"])),
                    selling_subtotal=Decimal(str(pricing["selling_subtotal"])),
                    gst_amount=Decimal(str(pricing["gst_amount"])),
                    shipping_fee=Decimal(str(pricing["shipping_fee"])),
                    total_amount=Decimal(str(pricing["total_amount"]))
                )

                for item in cart_items:
                    pricing_obj = getattr(item.product, 'pricing', None)
                    price = pricing_obj.dealer_price if (request.user.role == 'dealer' and request.user.dealer_status == 'approved' and pricing_obj.dealer_price is not None) else pricing_obj.effective_price

                    OrderItem.objects.create(
                        order=order,
                        product=item.product,
                        quantity=item.quantity,
                        price=price
                    )

                    # Reserve inventory stock
                    inventory = getattr(item.product, 'inventory', None)
                    if inventory:
                        inventory.reserved_stock += item.quantity
                        inventory.save()

                # Clear cart if not buy_now
                if not is_buy_now:
                    Cart.objects.get(user=request.user).items.all().delete()

                # Build response matching the frontend orderData expectations
                items_serialized = []
                for order_item in order.items.all():
                    primary_img = order_item.product.images.filter(is_primary=True).first() or order_item.product.images.first()
                    items_serialized.append({
                        "id": order_item.product.slug,
                        "name": order_item.product.name,
                        "category": order_item.product.category.name,
                        "price": float(order_item.price),
                        "qty": order_item.quantity,
                        "image": primary_img.image.url if primary_img else ""
                    })

                response_data = {
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
                        "phone": address.mobile
                    },
                    "paymentMethod": order.payment_method,
                    "pricing": {
                        "subtotal": pricing["selling_subtotal"],
                        "shipping": pricing["shipping_fee"],
                        "gst": pricing["gst_amount"],
                        "discount": pricing["savings"],
                        "total": pricing["total_amount"],
                        "savings": pricing["savings"]
                    }
                }

                return success_response(data=response_data, message="Order placed successfully.")
        except Exception as e:
            return error_response(f"Order placement failed: {str(e)}", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
