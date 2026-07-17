from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.common.mixins import BaseModel
from apps.products.models import Product
from apps.users.models import Address

class OrderStatus(models.TextChoices):
    PENDING_PAYMENT = "pending_payment", "Pending Payment"
    PROCESSING      = "processing",      "Processing"
    PACKED          = "packed",          "Packed"
    SHIPPED         = "shipped",         "Shipped"
    DELIVERED       = "delivered",       "Delivered"
    CANCELLED       = "cancelled",       "Cancelled"

class Order(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
        verbose_name="User"
    )
    shipping_address = models.ForeignKey(
        Address,
        on_delete=models.PROTECT,
        verbose_name="Shipping Address"
    )
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PROCESSING,
        verbose_name="Status"
    )
    payment_method = models.CharField(
        max_length=50,
        default="upi",
        verbose_name="Payment Method"
    )
    
    # Financial details snapshot
    mrp_subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="MRP Subtotal"
    )
    selling_subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Selling Subtotal"
    )
    gst_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="GST Amount"
    )
    shipping_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        verbose_name="Shipping Fee"
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Total Amount"
    )

    # Production-ready fields
    order_number = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        verbose_name="Order Number"
    )
    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        verbose_name="Invoice Number"
    )
    estimated_delivery_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Estimated Delivery Date"
    )
    tracking_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Tracking Number"
    )
    shipping_carrier = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Shipping Carrier"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Admin Notes"
    )
    cancellation_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name="Cancellation Reason"
    )
    cancelled_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Cancelled At"
    )
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cancelled_orders",
        verbose_name="Cancelled By"
    )
    packed_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Packed At"
    )
    shipped_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Shipped At"
    )
    delivered_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Delivered At"
    )

    class Meta(BaseModel.Meta):
        verbose_name = "Order"
        verbose_name_plural = "Orders"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order {self.order_number or self.id} - {self.status}"

    def save(self, *args, **kwargs):
        # Auto-generate order number and invoice number
        is_new = self._state.adding
        if is_new or not self.order_number:
            now = timezone.now()
            date_str = now.strftime("%Y%m")
            # Count the orders created today/this month for simple suffix
            count = Order.objects.filter(created_at__year=now.year, created_at__month=now.month).count() + 1
            self.order_number = f"FAAZO-{date_str}-{count:04d}"
            
        if not self.invoice_number:
            self.invoice_number = f"INV-{self.order_number}"

        # Populate estimated delivery date if not set (default 4 days out)
        if not self.estimated_delivery_date:
            self.estimated_delivery_date = (timezone.now() + timezone.timedelta(days=4)).date()

        super().save(*args, **kwargs)


class OrderItem(BaseModel):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="Order"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        verbose_name="Product"
    )
    quantity = models.PositiveIntegerField(
        verbose_name="Quantity"
    )
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Purchase Unit Price"
    )

    class Meta(BaseModel.Meta):
        verbose_name = "Order Item"
        verbose_name_plural = "Order Items"

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in Order {self.order.order_number or self.order.id}"


class OrderStatusHistory(BaseModel):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="status_history",
        verbose_name="Order"
    )
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        verbose_name="Status"
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Changed By"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notes"
    )
    
    class Meta(BaseModel.Meta):
        ordering = ["created_at"]
        verbose_name = "Order Status History"
        verbose_name_plural = "Order Status Histories"

    def __str__(self):
        return f"{self.order.order_number or self.order.id} changed to {self.status} at {self.created_at}"
