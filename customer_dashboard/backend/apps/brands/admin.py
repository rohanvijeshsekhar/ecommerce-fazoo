from django.contrib import admin
from .models import Brand, BrandDocument


class BrandDocumentInline(admin.TabularInline):
    model = BrandDocument
    extra = 0
    fields = ("title", "document_type", "file", "external_url", "is_public")


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display  = ("name", "country_of_origin", "warranty_months_default", "is_active", "created_at")
    list_filter   = ("is_active", "is_warranty_transferable", "country_of_origin")
    search_fields = ("name", "slug", "support_email")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by")
    inlines = [BrandDocumentInline]

    fieldsets = (
        ("Identity", {
            "fields": ("name", "slug", "description", "logo", "country_of_origin", "is_active"),
        }),
        ("Contact", {
            "fields": ("website_url", "support_email", "support_phone"),
        }),
        ("Warranty Policy", {
            "fields": ("warranty_policy_text", "warranty_months_default", "is_warranty_transferable"),
        }),
        ("Service Policy", {
            "fields": ("service_policy_text", "service_turnaround_days"),
        }),
        ("Compliance", {
            "fields": ("certifications", "documentation_url"),
        }),
        ("Audit", {
            "fields": ("created_at", "updated_at", "created_by", "updated_by"),
            "classes": ("collapse",),
        }),
    )


@admin.register(BrandDocument)
class BrandDocumentAdmin(admin.ModelAdmin):
    list_display  = ("title", "brand", "document_type", "is_public", "created_at")
    list_filter   = ("document_type", "is_public")
    search_fields = ("title", "brand__name")
    raw_id_fields = ("brand",)
