"""
FAAZO – Shipping & Fulfillment Views

Admin endpoints:
  POST   /api/v1/shipping/admin/shipments/                → create shipment
  GET    /api/v1/shipping/admin/shipments/                → list all shipments
  GET    /api/v1/shipping/admin/shipments/<pk>/           → shipment detail
  POST   /api/v1/shipping/admin/shipments/<pk>/sync/      → sync tracking
  POST   /api/v1/shipping/admin/shipments/<pk>/schedule-pickup/ → schedule pickup
  POST   /api/v1/shipping/admin/shipments/<pk>/cancel/    → cancel shipment
  GET    /api/v1/shipping/admin/stats/                    → fulfillment stats

Customer endpoints:
  GET    /api/v1/shipping/orders/<order_pk>/shipment/     → own order tracking

Webhook endpoint (no auth):
  POST   /api/v1/shipping/webhooks/delhivery/             → Delhivery callback
"""

import logging
from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.common.responses import success_response, error_response
from apps.common.permissions import IsAdmin
from apps.orders.models import Order, OrderStatus

from .models import Shipment, ShipmentStatus
from .serializers import ShipmentSerializer, ShipmentListSerializer
from .services import DelhiveryService, DelhiveryAPIError, DelhiveryValidationError

logger = logging.getLogger("faazo")


# ============================================================
# Admin — Create Shipment
# ============================================================

class AdminShipmentCreateView(APIView):
    """
    POST /api/v1/shipping/admin/shipments/

    Body:
      order_id (UUID): required
      weight (float): kg
      length, breadth, height (float): cm
      payment_mode (str): 'Prepaid' | 'COD'
      pickup_date (str): YYYY-MM-DD (optional)
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        order_id = request.data.get("order_id")
        if not order_id:
            return error_response("order_id is required.", status_code=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.prefetch_related("items__product", "shipping_address").get(pk=order_id)
        except Order.DoesNotExist:
            return error_response("Order not found.", status_code=status.HTTP_404_NOT_FOUND)

        # Only allow shipment creation for packed (or processing) orders
        if order.status not in [OrderStatus.PACKED, OrderStatus.PROCESSING]:
            return error_response(
                f"Cannot create shipment for order in '{order.status}' status. "
                f"Order must be in 'packed' or 'processing' status.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(order, "shipment"):
            return error_response(
                "A shipment already exists for this order.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        package_info = {
            "weight": float(request.data.get("weight", 0.5)),
            "length": float(request.data.get("length", 10)),
            "breadth": float(request.data.get("breadth", 10)),
            "height": float(request.data.get("height", 10)),
            "payment_mode": request.data.get("payment_mode", "Prepaid"),
        }

        try:
            with transaction.atomic():
                svc = DelhiveryService()
                shipment = svc.create_shipment(order, package_info, created_by=request.user)

                # Move order to shipped status if it was packed
                if order.status in [OrderStatus.PACKED, OrderStatus.PROCESSING]:
                    from apps.orders.models import OrderStatusHistory
                    order.status = OrderStatus.SHIPPED
                    order.tracking_number = shipment.awb_number
                    order.shipping_carrier = shipment.courier_name
                    order.shipped_at = shipment.created_at
                    order.save(update_fields=["status", "tracking_number", "shipping_carrier", "shipped_at"])
                    OrderStatusHistory.objects.create(
                        order=order,
                        status=OrderStatus.SHIPPED,
                        changed_by=request.user,
                        notes=f"Shipment created via Delhivery. AWB: {shipment.awb_number}",
                    )

                    # Inventory: deduct physical stock
                    for item in order.items.all():
                        inventory = getattr(item.product, "inventory", None)
                        if inventory:
                            inventory.current_stock = max(0, inventory.current_stock - item.quantity)
                            inventory.reserved_stock = max(0, inventory.reserved_stock - item.quantity)
                            inventory.save()

                # Auto-schedule pickup if pickup_date provided
                pickup_date_str = request.data.get("pickup_date")
                if pickup_date_str:
                    from datetime import date
                    try:
                        from django.utils.dateparse import parse_date
                        pd = parse_date(pickup_date_str)
                        if pd:
                            svc.schedule_pickup(shipment, pickup_date=pd)
                    except Exception as e:
                        logger.warning("Failed to schedule pickup: %s", e)

        except DelhiveryValidationError as e:
            # Return structured validation errors (user-friendly list)
            return error_response(
                "Shipment validation failed. Please fix the issues below.",
                status_code=status.HTTP_400_BAD_REQUEST,
                details=e.errors,
            )
        except DelhiveryAPIError as e:
            return error_response(str(e), status_code=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            logger.exception("Unexpected error creating shipment: %s", e)
            return error_response("Failed to create shipment.", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = ShipmentSerializer(shipment)
        return success_response(
            data=serializer.data,
            message=f"Shipment created successfully. AWB: {shipment.awb_number}",
            status_code=status.HTTP_201_CREATED,
        )


# ============================================================
# Admin — List Shipments
# ============================================================

class AdminShipmentListView(APIView):
    """
    GET /api/v1/shipping/admin/shipments/
    Query params: status, search (AWB/order/customer), page, page_size
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        shipments = Shipment.objects.select_related(
            "order__user", "created_by"
        ).prefetch_related("tracking_events").order_by("-created_at")

        # Filter by shipment status
        status_filter = request.query_params.get("status")
        if status_filter and status_filter != "all":
            shipments = shipments.filter(shipment_status=status_filter)

        # Search by AWB / order number / customer
        search = request.query_params.get("search", "").strip()
        if search:
            shipments = shipments.filter(
                Q(awb_number__icontains=search) |
                Q(order__order_number__icontains=search) |
                Q(order__user__full_name__icontains=search) |
                Q(order__user__email__icontains=search)
            ).distinct()

        # Date filters
        pickup_date = request.query_params.get("pickup_date")
        if pickup_date:
            shipments = shipments.filter(pickup_scheduled_date=pickup_date)

        delivery_date = request.query_params.get("delivery_date")
        if delivery_date:
            shipments = shipments.filter(estimated_delivery_date=delivery_date)

        # Pagination
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        total = shipments.count()
        start = (page - 1) * page_size
        end = start + page_size
        shipments_page = shipments[start:end]

        serializer = ShipmentListSerializer(shipments_page, many=True)
        return success_response(
            data=serializer.data,
            message="Shipments retrieved.",
            meta={"pagination": {"page": page, "page_size": page_size, "total": total,
                                  "total_pages": (total + page_size - 1) // page_size}},
        )


# ============================================================
# Admin — Shipment Detail
# ============================================================

class AdminShipmentDetailView(APIView):
    """GET /api/v1/shipping/admin/shipments/<pk>/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        try:
            shipment = Shipment.objects.select_related(
                "order__user", "created_by"
            ).prefetch_related("tracking_events").get(pk=pk)
        except Shipment.DoesNotExist:
            return error_response("Shipment not found.", status_code=status.HTTP_404_NOT_FOUND)

        serializer = ShipmentSerializer(shipment)
        return success_response(data=serializer.data)


# ============================================================
# Admin — Sync Tracking
# ============================================================

class AdminShipmentSyncView(APIView):
    """POST /api/v1/shipping/admin/shipments/<pk>/sync/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            shipment = Shipment.objects.select_related("order").prefetch_related("tracking_events").get(pk=pk)
        except Shipment.DoesNotExist:
            return error_response("Shipment not found.", status_code=status.HTTP_404_NOT_FOUND)

        try:
            svc = DelhiveryService()
            new_events = svc.sync_tracking(shipment, event_source="api_poll")
        except DelhiveryAPIError as e:
            return error_response(str(e), status_code=status.HTTP_502_BAD_GATEWAY)

        # If shipment is now delivered, trigger warranty
        shipment.refresh_from_db()
        if shipment.shipment_status == ShipmentStatus.DELIVERED:
            order = shipment.order
            if order.status != OrderStatus.DELIVERED:
                from apps.orders.models import OrderStatusHistory
                order.delivered_at = shipment.delivered_at
                order.status = OrderStatus.DELIVERED
                order.save(update_fields=["status", "delivered_at"])
                OrderStatusHistory.objects.create(
                    order=order,
                    status=OrderStatus.DELIVERED,
                    changed_by=request.user,
                    notes="Order marked as Delivered after Delhivery tracking sync.",
                )
                from apps.warranty.services import create_warranty_registrations
                create_warranty_registrations(order)

        serializer = ShipmentSerializer(shipment)
        return success_response(
            data=serializer.data,
            message=f"Tracking synced. {len(new_events)} new event(s) recorded.",
        )


# ============================================================
# Admin — Schedule Pickup
# ============================================================

class AdminSchedulePickupView(APIView):
    """POST /api/v1/shipping/admin/shipments/<pk>/schedule-pickup/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            shipment = Shipment.objects.get(pk=pk)
        except Shipment.DoesNotExist:
            return error_response("Shipment not found.", status_code=status.HTTP_404_NOT_FOUND)

        pickup_date_str = request.data.get("pickup_date")
        pickup_date = None
        if pickup_date_str:
            from django.utils.dateparse import parse_date
            pickup_date = parse_date(pickup_date_str)

        try:
            svc = DelhiveryService()
            svc.schedule_pickup(shipment, pickup_date=pickup_date)
        except DelhiveryAPIError as e:
            return error_response(str(e), status_code=status.HTTP_502_BAD_GATEWAY)

        serializer = ShipmentSerializer(shipment)
        return success_response(data=serializer.data, message="Pickup scheduled successfully.")


# ============================================================
# Admin — Cancel Shipment
# ============================================================

class AdminCancelShipmentView(APIView):
    """POST /api/v1/shipping/admin/shipments/<pk>/cancel/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            shipment = Shipment.objects.select_related("order").get(pk=pk)
        except Shipment.DoesNotExist:
            return error_response("Shipment not found.", status_code=status.HTTP_404_NOT_FOUND)

        try:
            svc = DelhiveryService()
            svc.cancel_shipment(shipment, cancelled_by=request.user)
        except DelhiveryAPIError as e:
            return error_response(str(e), status_code=status.HTTP_400_BAD_REQUEST)

        serializer = ShipmentSerializer(shipment)
        return success_response(data=serializer.data, message="Shipment cancelled successfully.")


# ============================================================
# Admin — Fulfillment Stats
# ============================================================

class AdminFulfillmentStatsView(APIView):
    """GET /api/v1/shipping/admin/stats/"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        base = Shipment.objects.all()
        stats = {
            "total_shipments":  base.count(),
            "created":          base.filter(shipment_status=ShipmentStatus.CREATED).count(),
            "pickup_scheduled": base.filter(shipment_status=ShipmentStatus.PICKUP_SCHEDULED).count(),
            "picked_up":        base.filter(shipment_status=ShipmentStatus.PICKED_UP).count(),
            "reached_hub":      base.filter(shipment_status=ShipmentStatus.REACHED_HUB).count(),
            "in_transit":       base.filter(shipment_status=ShipmentStatus.IN_TRANSIT).count(),
            "out_for_delivery": base.filter(shipment_status=ShipmentStatus.OUT_FOR_DELIVERY).count(),
            "delivered":        base.filter(shipment_status=ShipmentStatus.DELIVERED).count(),
            "failed_delivery":  base.filter(shipment_status=ShipmentStatus.FAILED_DELIVERY).count(),
            "cancelled":        base.filter(shipment_status=ShipmentStatus.CANCELLED).count(),
            "rto_initiated":    base.filter(shipment_status=ShipmentStatus.RTO_INITIATED).count(),
        }

        # Pending packing — orders in processing or packed without a shipment
        from apps.orders.models import Order
        pending_packing = Order.objects.filter(
            status__in=[OrderStatus.PROCESSING, OrderStatus.PACKED],
            shipment__isnull=True,
        ).count()
        stats["pending_packing"] = pending_packing

        return success_response(data=stats, message="Fulfillment stats retrieved.")


# ============================================================
# Customer — Order Shipment Tracking
# ============================================================

class CustomerShipmentTrackingView(APIView):
    """
    GET /api/v1/shipping/orders/<order_pk>/shipment/
    Returns shipment tracking for the authenticated customer's own order.
    Internal notes, AWB, and warehouse data are excluded.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, order_pk):
        try:
            order = Order.objects.get(pk=order_pk, user=request.user)
        except Order.DoesNotExist:
            return error_response("Order not found.", status_code=status.HTTP_404_NOT_FOUND)

        try:
            shipment = Shipment.objects.prefetch_related("tracking_events").get(order=order)
        except Shipment.DoesNotExist:
            return success_response(data=None, message="No shipment found for this order.")

        # Customer-safe serializer (excludes raw_response, customer email, created_by)
        data = {
            "id": str(shipment.id),
            "courier_name": shipment.courier_name,
            "awb_number": shipment.awb_number,
            "tracking_number": shipment.tracking_number,
            "shipment_status": shipment.shipment_status,
            "pickup_status": shipment.pickup_status,
            "current_location": shipment.current_location,
            "estimated_delivery_date": str(shipment.estimated_delivery_date) if shipment.estimated_delivery_date else None,
            "delivered_at": shipment.delivered_at.isoformat() if shipment.delivered_at else None,
            "last_synced_at": shipment.last_synced_at.isoformat() if shipment.last_synced_at else None,
            "tracking_events": [
                {
                    "id": str(evt.id),
                    "event_label": evt.event_label,
                    "status_mapped": evt.status_mapped,
                    "event_timestamp": evt.event_timestamp.isoformat(),
                    "location": evt.location,
                    "description": evt.description,
                    "is_delivered": evt.is_delivered,
                }
                for evt in shipment.tracking_events.order_by("event_timestamp")
            ],
        }
        return success_response(data=data, message="Shipment tracking retrieved.")


# ============================================================
# Webhook — Delhivery Callback
# ============================================================

class DelhiveryWebhookView(APIView):
    """
    POST /api/v1/shipping/webhooks/delhivery/
    No authentication — Delhivery pushes tracking events here.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data
        logger.info("Delhivery webhook received: %s", str(payload)[:200])

        try:
            svc = DelhiveryService()
            new_events = svc.process_webhook(payload)
        except Exception as e:
            logger.exception("Delhivery webhook processing error: %s", e)
            # Always return 200 to Delhivery to prevent retries
            return success_response(data={}, message="Webhook acknowledged.")

        return success_response(
            data={"new_events": len(new_events)},
            message="Webhook processed.",
        )


# ============================================================
# Admin — Provider Health Check
# ============================================================

class AdminProviderHealthCheckView(APIView):
    """
    GET /api/v1/shipping/admin/health/
    Reports shipping provider connectivity, active provider mode, configuration validity,
    and last API call metrics.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        from .providers import ShippingConfigValidator, get_shipping_provider

        cfg_provider = getattr(settings, "SHIPPING_PROVIDER", "offline").lower()
        active_provider_obj = get_shipping_provider()
        active_provider_class = active_provider_obj.__class__.__name__

        is_valid, validation_reasons = ShippingConfigValidator.validate_delhivery_config(cfg_provider) if cfg_provider in ["sandbox", "live"] else (True, [])

        last_shipment = Shipment.objects.order_by("-created_at").first()
        last_api_call = Shipment.objects.filter(request_timestamp__isnull=False).order_by("-request_timestamp").first()

        health_data = {
            "status": "Online" if (cfg_provider == "offline" or is_valid) else "Fallback (Offline)",
            "configured_provider": cfg_provider,
            "active_provider_class": active_provider_class,
            "is_config_valid": is_valid,
            "validation_reasons": validation_reasons,
            "pickup_location": getattr(settings, "DELHIVERY_PICKUP_LOCATION", ""),
            "seller_name": getattr(settings, "DELHIVERY_SELLER_NAME", ""),
            "last_shipment": {
                "id": str(last_shipment.id) if last_shipment else None,
                "awb_number": last_shipment.awb_number if last_shipment else None,
                "provider": last_shipment.provider if last_shipment else None,
                "created_at": last_shipment.created_at.isoformat() if last_shipment else None,
            } if last_shipment else None,
            "last_api_call": {
                "request_timestamp": last_api_call.request_timestamp.isoformat() if last_api_call and last_api_call.request_timestamp else None,
                "status_code": last_api_call.api_status_code if last_api_call else None,
                "execution_time_ms": last_api_call.execution_time_ms if last_api_call else None,
            } if last_api_call else None,
        }

        return success_response(data=health_data, message="Provider health status retrieved.")
