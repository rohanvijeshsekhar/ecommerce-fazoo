from django.contrib import admin
from apps.support.models import SupportTicket, SupportMessage, TicketTimeline

class SupportMessageInline(admin.TabularInline):
    model = SupportMessage
    extra = 1

class TicketTimelineInline(admin.TabularInline):
    model = TicketTimeline
    extra = 0
    readonly_fields = ["action", "performed_by", "notes", "created_at"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ["ticket_number", "user", "subject", "category", "priority", "status", "assigned_admin", "created_at"]
    list_filter = ["status", "priority", "category"]
    search_fields = ["ticket_number", "subject", "description", "user__email", "user__full_name"]
    readonly_fields = ["ticket_number", "created_at", "updated_at", "resolved_at"]
    inlines = [SupportMessageInline, TicketTimelineInline]
