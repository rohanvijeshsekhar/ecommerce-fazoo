"""
FAAZO – Shipping Serializers
"""

from rest_framework import serializers
from .models import Shipment, ShipmentTrackingEvent


class ShipmentTrackingEventSerializer(serializers.ModelSerializer):

    class Meta:
        model = ShipmentTrackingEvent
        fields = [
            "id",
            "event_code",
            "event_label",
            "status_mapped",
            "event_timestamp",
            "location",
            "description",
            "event_source",
            "is_delivered",
            "created_at",
        ]


class ShipmentSerializer(serializers.ModelSerializer):
    tracking_events = ShipmentTrackingEventSerializer(many=True, read_only=True)
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    customer_name = serializers.CharField(source="order.user.full_name", read_only=True)
    customer_email = serializers.CharField(source="order.user.email", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default="")
    is_cancellable = serializers.BooleanField(read_only=True)
    is_delivered = serializers.BooleanField(read_only=True)

    class Meta:
        model = Shipment
        fields = [
            "id",
            "order_number",
            "customer_name",
            "customer_email",
            "created_by_name",
            "courier_name",
            "delhivery_shipment_id",
            "awb_number",
            "tracking_number",
            "shipment_status",
            "pickup_status",
            "current_location",
            "pickup_scheduled_date",
            "pickup_date",
            "estimated_delivery_date",
            "delivered_at",
            "last_synced_at",
            "is_cancellable",
            "is_delivered",
            "tracking_events",
            "created_at",
            "updated_at",
        ]


class ShipmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views — no nested events."""
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    customer_name = serializers.CharField(source="order.user.full_name", read_only=True)
    is_cancellable = serializers.BooleanField(read_only=True)

    class Meta:
        model = Shipment
        fields = [
            "id",
            "order_number",
            "customer_name",
            "courier_name",
            "awb_number",
            "shipment_status",
            "pickup_status",
            "current_location",
            "estimated_delivery_date",
            "last_synced_at",
            "is_cancellable",
            "created_at",
        ]
