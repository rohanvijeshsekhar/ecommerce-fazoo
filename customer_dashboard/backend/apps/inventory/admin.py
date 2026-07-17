from django.contrib import admin
from .models import ProductInventory


@admin.register(ProductInventory)
class ProductInventoryAdmin(admin.ModelAdmin):
    list_display = ["product", "current_stock", "reserved_stock", "available_stock", "low_stock_threshold", "stock_status", "allow_backorders"]
    list_select_related = ["product"]
    search_fields = ["product__name", "product__sku"]
    readonly_fields = ["reserved_stock", "available_stock", "stock_status", "is_purchasable", "created_at", "updated_at"]
    fieldsets = (
        ("Product", {"fields": ("product",)}),
        ("Stock Levels", {"fields": ("current_stock", "reserved_stock", "available_stock")}),
        ("Settings", {"fields": ("low_stock_threshold", "allow_backorders")}),
        ("Status (Read-only)", {"fields": ("stock_status", "is_purchasable")}),
        ("Audit", {"fields": ("created_at", "updated_at")}),
    )
