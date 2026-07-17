"""
FAAZO – Dealer Admin

Registers DealerApplication in Django Admin.

Phase 3 Scope: Read-only listing with status filter.
Phase 7 Scope: Approve/Reject bulk actions + document preview will be added.

Note: Full approve/reject admin actions are added in Milestone 7.
      This admin provides visibility into applications from day one.
"""

from django.contrib import admin
from django.utils.html import format_html

from apps.dealer.models import DealerApplication, DealerStatus, DealerApplicationDocument


class DealerApplicationDocumentInline(admin.TabularInline):
    model = DealerApplicationDocument
    extra = 0
    readonly_fields = ("document", "uploaded_at")


@admin.register(DealerApplication)
class DealerApplicationAdmin(admin.ModelAdmin):
    inlines = [DealerApplicationDocumentInline]
    list_display = (
        "company_name",
        "user_email",
        "status_badge",
        "created_at",
        "reviewed_by",
        "reviewed_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("company_name", "user__email", "user__full_name")
    raw_id_fields = ("user", "reviewed_by")
    readonly_fields = (
        "id",
        "user",
        "company_name",
        "document",
        "status",
        "rejection_reason",
        "reviewed_by",
        "reviewed_at",
        "created_at",
        "updated_at",
    )
    ordering = ("-created_at",)
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Application",
            {
                "fields": ("id", "user", "company_name", "document"),
            },
        ),
        (
            "Review",
            {
                "fields": ("status", "rejection_reason", "reviewed_by", "reviewed_at"),
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def has_add_permission(self, request):
        """Dealer applications are created programmatically at registration."""
        return False

    @admin.display(description="Applicant Email")
    def user_email(self, obj: DealerApplication) -> str:
        return obj.user.email

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj: DealerApplication) -> str:
        colours = {
            DealerStatus.PENDING: ("#B45309", "#FFF3CD"),
            DealerStatus.APPROVED: ("#276749", "#C6F6D5"),
            DealerStatus.REJECTED: ("#9B2C2C", "#FED7D7"),
        }
        colour, bg = colours.get(obj.status, ("#4A5568", "#EDF2F7"))
        return format_html(
            '<span style="background:{};color:{};padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:700">{}</span>',
            bg,
            colour,
            obj.get_status_display(),
        )
