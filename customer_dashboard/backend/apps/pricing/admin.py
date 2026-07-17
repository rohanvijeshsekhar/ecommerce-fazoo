from django.contrib import admin
from .models import ProductPricing


@admin.register(ProductPricing)
class ProductPricingAdmin(admin.ModelAdmin):
    list_display = ["product", "mrp", "selling_price", "offer_price", "dealer_price", "gst_percentage", "is_offer_active", "effective_price"]
    list_select_related = ["product"]
    search_fields = ["product__name", "product__sku"]
    readonly_fields = ["is_offer_active", "effective_price", "discount_percentage", "you_save", "created_at", "updated_at"]
    fieldsets = (
        ("Product", {"fields": ("product",)}),
        ("Prices", {"fields": ("mrp", "selling_price", "offer_price", "dealer_price")}),
        ("Tax", {"fields": ("gst_percentage",)}),
        ("Offer Window", {"fields": ("offer_start_date", "offer_end_date")}),
        ("Computed (Read-only)", {"fields": ("is_offer_active", "effective_price", "discount_percentage", "you_save")}),
        ("Audit", {"fields": ("created_at", "updated_at")}),
    )
