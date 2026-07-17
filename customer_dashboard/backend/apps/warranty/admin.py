from django.contrib import admin
from apps.warranty.models import (
    WarrantyRegistration,
    WarrantyClaim,
    WarrantyAttachment,
    ClaimTimeline
)

@admin.register(WarrantyRegistration)
class WarrantyRegistrationAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "order", "product", "serial_number", "warranty_status", "warranty_end"]
    list_filter = ["warranty_status", "warranty_provider"]
    search_fields = ["user__email", "product__name", "serial_number", "order__order_number"]


class WarrantyAttachmentInline(admin.TabularInline):
    model = WarrantyAttachment
    extra = 0


class ClaimTimelineInline(admin.TabularInline):
    model = ClaimTimeline
    extra = 0
    readonly_fields = ["action", "performed_by", "notes", "created_at"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(WarrantyClaim)
class WarrantyClaimAdmin(admin.ModelAdmin):
    list_display = ["claim_number", "registration", "priority", "status", "assigned_provider", "created_at"]
    list_filter = ["status", "priority"]
    search_fields = ["claim_number", "registration__serial_number", "registration__user__email"]
    inlines = [WarrantyAttachmentInline, ClaimTimelineInline]


@admin.register(WarrantyAttachment)
class WarrantyAttachmentAdmin(admin.ModelAdmin):
    list_display = ["id", "claim", "attachment_type", "file"]
    list_filter = ["attachment_type"]


@admin.register(ClaimTimeline)
class ClaimTimelineAdmin(admin.ModelAdmin):
    list_display = ["id", "claim", "action", "performed_by", "created_at"]
    readonly_fields = ["claim", "action", "performed_by", "notes", "created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
