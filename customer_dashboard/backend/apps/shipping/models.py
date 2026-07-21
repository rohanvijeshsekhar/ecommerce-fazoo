"""
FAAZO – Shipping & Fulfillment Models

Stores Delhivery shipment records and complete tracking event history.
All records are append-only — tracking events are never overwritten.

Models:
  ShipmentStatus   ← TextChoices for Delhivery-mapped statuses
  Shipment         ← One-to-one with Order; the live fulfillment record
  ShipmentTrackingEvent ← Append-only history of every Delhivery event
"""

import uuid
from django.conf import settings
from django.db import models
from apps.common.mixins import BaseModel
from apps.orders.models import Order


# ============================================================
# Status Choices
# ============================================================

class ShipmentStatus(models.TextChoices):
    """
    Mirrors Delhivery's shipment status codes, normalised for FAAZO.
    Covers the full lifecycle from creation to final delivery/cancellation.
    """
    CREATED           = "created",           "Shipment Created"
    PICKUP_SCHEDULED  = "pickup_scheduled",  "Pickup Scheduled"
    PICKED_UP         = "picked_up",         "Picked Up"
    REACHED_HUB       = "reached_hub",       "Reached Hub"
    IN_TRANSIT        = "in_transit",        "In Transit"
    OUT_FOR_DELIVERY  = "out_for_delivery",  "Out for Delivery"
    DELIVERED         = "delivered",         "Delivered"
    FAILED_DELIVERY   = "failed_delivery",   "Failed Delivery"
    RTO_INITIATED     = "rto_initiated",     "RTO Initiated"
    RTO_IN_TRANSIT    = "rto_in_transit",    "RTO In Transit"
    RTO_DELIVERED     = "rto_delivered",     "RTO Delivered"
    CANCELLED         = "cancelled",         "Cancelled"
    LOST              = "lost",              "Lost"


class PickupStatus(models.TextChoices):
    PENDING    = "pending",    "Pending"
    SCHEDULED  = "scheduled",  "Scheduled"
    PICKED_UP  = "picked_up",  "Picked Up"
    FAILED     = "failed",     "Failed"
    CANCELLED  = "cancelled",  "Cancelled"


# ============================================================
# Shipment
# ============================================================

class Shipment(BaseModel):
    """
    Central fulfillment record for every FAAZO order dispatched via Delhivery.

    One shipment per order. Created manually by the warehouse admin
    after the order reaches 'packed' status.

    Raw Delhivery API responses are stored in `raw_response` for full auditability.
    """

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="shipment",
        verbose_name="Order",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_shipments",
        verbose_name="Created By",
    )

    # ── Provider & Execution Mode ────────────────────────────
    provider = models.CharField(
        max_length=20,
        choices=[
            ("offline", "Offline Simulation"),
            ("sandbox", "Delhivery Sandbox"),
            ("live", "Delhivery Live"),
        ],
        default="offline",
        verbose_name="Shipping Provider",
        db_index=True,
    )

    # ── Delhivery & Provider Identifiers ─────────────────────
    courier_name = models.CharField(
        max_length=100,
        default="Delhivery",
        verbose_name="Courier Name",
    )
    delhivery_shipment_id = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Delhivery Shipment ID",
        db_index=True,
    )
    external_shipment_id = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="External Shipment ID",
    )
    awb_number = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="AWB Number",
        db_index=True,
    )
    tracking_number = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Tracking Number",
    )
    pickup_request_id = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Pickup Request ID",
    )
    tracking_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Tracking URL",
    )

    # ── Shipment State ───────────────────────────────────────
    shipment_status = models.CharField(
        max_length=30,
        choices=ShipmentStatus.choices,
        default=ShipmentStatus.CREATED,
        verbose_name="Shipment Status",
        db_index=True,
    )
    pickup_status = models.CharField(
        max_length=20,
        choices=PickupStatus.choices,
        default=PickupStatus.PENDING,
        verbose_name="Pickup Status",
    )
    current_location = models.CharField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Current Location",
    )

    # ── Scheduling & Delivery ────────────────────────────────
    pickup_scheduled_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Pickup Scheduled Date",
    )
    pickup_date = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Picked Up At",
    )
    estimated_delivery_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Estimated Delivery Date",
    )
    delivered_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Delivered At",
    )

    # ── Sync Metadata & Metrics ──────────────────────────────
    last_synced_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Last Synced At",
    )
    request_timestamp = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Request Timestamp",
    )
    response_timestamp = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Response Timestamp",
    )
    api_status_code = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="API Status Code",
    )
    execution_time_ms = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Execution Time (ms)",
    )
    error_message = models.TextField(
        blank=True,
        default="",
        verbose_name="Error Message",
    )

    # ── Audit Storage ────────────────────────────────────────
    request_payload = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Request Payload",
    )
    response_payload = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Response Payload",
    )
    raw_response = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Raw Delhivery API Response",
    )

    class Meta(BaseModel.Meta):
        verbose_name = "Shipment"
        verbose_name_plural = "Shipments"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Shipment {self.awb_number or self.id} — {self.shipment_status}"

    @property
    def is_cancellable(self) -> bool:
        """True if shipment can still be cancelled (before pickup)."""
        return self.shipment_status in [
            ShipmentStatus.CREATED,
            ShipmentStatus.PICKUP_SCHEDULED,
        ]

    @property
    def is_delivered(self) -> bool:
        return self.shipment_status == ShipmentStatus.DELIVERED


# ============================================================
# ShipmentTrackingEvent
# ============================================================

class ShipmentTrackingEvent(BaseModel):
    """
    Immutable log of every tracking event received from Delhivery.

    Records are NEVER updated or deleted. New events are always appended.
    This ensures a complete, tamper-proof audit trail of the package journey.
    """

    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        related_name="tracking_events",
        verbose_name="Shipment",
    )

    # ── Event Details ────────────────────────────────────────
    event_code = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Delhivery Event Code",
    )
    event_label = models.CharField(
        max_length=200,
        verbose_name="Event Label",
    )
    status_mapped = models.CharField(
        max_length=30,
        choices=ShipmentStatus.choices,
        verbose_name="Mapped Shipment Status",
    )
    event_timestamp = models.DateTimeField(
        verbose_name="Event Timestamp",
    )
    location = models.CharField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Location",
    )
    description = models.TextField(
        blank=True,
        default="",
        verbose_name="Description",
    )

    # ── Source ───────────────────────────────────────────────
    event_source = models.CharField(
        max_length=50,
        choices=[
            ("api_poll", "API Poll"),
            ("webhook", "Delhivery Webhook"),
            ("manual", "Manual Admin"),
        ],
        default="api_poll",
        verbose_name="Event Source",
    )
    is_delivered = models.BooleanField(
        default=False,
        verbose_name="Is Delivered Event",
    )

    class Meta(BaseModel.Meta):
        verbose_name = "Shipment Tracking Event"
        verbose_name_plural = "Shipment Tracking Events"
        ordering = ["-event_timestamp"]

    def __str__(self):
        return f"{self.shipment.awb_number} — {self.event_label} @ {self.event_timestamp}"
