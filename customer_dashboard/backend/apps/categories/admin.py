from django.contrib import admin
from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display  = ("name", "parent", "depth_display", "sort_order", "is_active", "active_product_count")
    list_filter   = ("is_active",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at", "full_path_display")
    ordering = ("sort_order", "name")

    fieldsets = (
        ("Identity", {
            "fields": ("name", "slug", "description", "image"),
        }),
        ("Hierarchy", {
            "fields": ("parent", "sort_order", "full_path_display"),
        }),
        ("Admin", {
            "fields": ("is_active",),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Depth")
    def depth_display(self, obj):
        return obj.depth

    @admin.display(description="Full Path")
    def full_path_display(self, obj):
        return obj.full_path
