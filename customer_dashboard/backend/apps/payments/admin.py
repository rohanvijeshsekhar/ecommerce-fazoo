from django.contrib import admin
from .models import Payment, WebhookEvent

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'razorpay_order_id',
        'razorpay_payment_id',
        'amount',
        'status',
        'order',
        'created_at',
    )
    list_filter = ('status', 'created_at', 'verified_at')
    search_fields = (
        'razorpay_order_id',
        'razorpay_payment_id',
        'user__email',
        'idempotency_key',
    )
    readonly_fields = (
        'id',
        'created_at',
        'updated_at',
        'gateway_response',
        'checkout_data',
    )
    ordering = ('-created_at',)

@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ('event_id', 'event_type', 'processed', 'created_at')
    list_filter = ('processed', 'event_type', 'created_at')
    search_fields = ('event_id', 'event_type')
    readonly_fields = ('id', 'created_at', 'updated_at', 'payload')
    ordering = ('-created_at',)
