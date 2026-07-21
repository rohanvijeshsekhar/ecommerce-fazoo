from django.contrib import admin
from .models import Shipment, ShipmentTrackingEvent


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = [
        "awb_number",
        "order_number",
        "courier_name",
        "shipment_status",
        "pickup_status",
        "current_location",
        "estimated_delivery_date",
        "last_synced_at",
        "created_at",
    ]
    list_filter = ["shipment_status", "pickup_status", "courier_name"]
    search_fields = ["awb_number", "order__order_number", "order__user__email"]
    readonly_fields = [
        "id", "awb_number", "delhivery_shipment_id", "tracking_number",
        "raw_response", "created_at", "updated_at", "last_synced_at",
    ]
    ordering = ["-created_at"]

    def order_number(self, obj):
        return obj.order.order_number
    order_number.short_description = "Order #"


@admin.register(ShipmentTrackingEvent)
class ShipmentTrackingEventAdmin(admin.ModelAdmin):
    list_display = [
        "shipment_awb",
        "event_label",
        "status_mapped",
        "event_timestamp",
        "location",
        "event_source",
    ]
    list_filter = ["status_mapped", "event_source", "is_delivered"]
    search_fields = ["shipment__awb_number", "event_label", "location"]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering = ["-event_timestamp"]

    def shipment_awb(self, obj):
        return obj.shipment.awb_number
    shipment_awb.short_description = "AWB"
