from django.urls import path
from .views import (
    AdminShipmentCreateView,
    AdminShipmentListView,
    AdminShipmentDetailView,
    AdminShipmentSyncView,
    AdminSchedulePickupView,
    AdminCancelShipmentView,
    AdminFulfillmentStatsView,
    AdminProviderHealthCheckView,
    CustomerShipmentTrackingView,
    DelhiveryWebhookView,
)

urlpatterns = [
    # ── Admin Shipment Endpoints ─────────────────────────────
    path(
        "shipping/admin/health/",
        AdminProviderHealthCheckView.as_view(),
        name="admin-shipping-health",
    ),
    path(
        "shipping/admin/shipments/",
        AdminShipmentListView.as_view(),
        name="admin-shipment-list",
    ),
    path(
        "shipping/admin/shipments/create/",
        AdminShipmentCreateView.as_view(),
        name="admin-shipment-create",
    ),
    path(
        "shipping/admin/shipments/<uuid:pk>/",
        AdminShipmentDetailView.as_view(),
        name="admin-shipment-detail",
    ),
    path(
        "shipping/admin/shipments/<uuid:pk>/sync/",
        AdminShipmentSyncView.as_view(),
        name="admin-shipment-sync",
    ),
    path(
        "shipping/admin/shipments/<uuid:pk>/schedule-pickup/",
        AdminSchedulePickupView.as_view(),
        name="admin-shipment-pickup",
    ),
    path(
        "shipping/admin/shipments/<uuid:pk>/cancel/",
        AdminCancelShipmentView.as_view(),
        name="admin-shipment-cancel",
    ),
    path(
        "shipping/admin/stats/",
        AdminFulfillmentStatsView.as_view(),
        name="admin-fulfillment-stats",
    ),

    # ── Customer Shipment Tracking ───────────────────────────
    path(
        "orders/<uuid:order_pk>/shipment/",
        CustomerShipmentTrackingView.as_view(),
        name="customer-shipment-tracking",
    ),

    # ── Delhivery Webhook ────────────────────────────────────
    path(
        "shipping/webhooks/delhivery/",
        DelhiveryWebhookView.as_view(),
        name="delhivery-webhook",
    ),
]
