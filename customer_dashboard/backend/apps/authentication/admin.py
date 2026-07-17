"""
FAAZO – Authentication Admin

Registers EmailVerificationToken and PasswordResetToken in Django Admin.
Read-only views — tokens are managed programmatically by services.
"""

from django.contrib import admin
from django.utils.html import format_html

from apps.authentication.models import EmailVerificationToken, PasswordResetToken


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ("user_email", "is_used", "is_valid_display", "created_at", "expires_at")
    list_filter = ("is_used",)
    search_fields = ("user__email",)
    readonly_fields = ("id", "user", "token_hash", "expires_at", "is_used", "created_at")
    ordering = ("-created_at",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    @admin.display(description="User")
    def user_email(self, obj: EmailVerificationToken) -> str:
        return obj.user.email

    @admin.display(description="Valid?", boolean=False)
    def is_valid_display(self, obj: EmailVerificationToken) -> str:
        if obj.is_valid:
            return format_html('<span style="color:#38A169;font-weight:600">✓ Valid</span>')
        elif obj.is_expired:
            return format_html('<span style="color:#718096">⏱ Expired</span>')
        else:
            return format_html('<span style="color:#E53E3E">✗ Used</span>')


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ("user_email", "is_used", "is_valid_display", "created_at", "expires_at", "used_at")
    list_filter = ("is_used",)
    search_fields = ("user__email",)
    readonly_fields = ("id", "user", "token_hash", "expires_at", "is_used", "used_at", "created_at")
    ordering = ("-created_at",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    @admin.display(description="User")
    def user_email(self, obj: PasswordResetToken) -> str:
        return obj.user.email

    @admin.display(description="Valid?", boolean=False)
    def is_valid_display(self, obj: PasswordResetToken) -> str:
        if obj.is_valid:
            return format_html('<span style="color:#38A169;font-weight:600">✓ Valid</span>')
        elif obj.is_expired:
            return format_html('<span style="color:#718096">⏱ Expired</span>')
        else:
            return format_html('<span style="color:#E53E3E">✗ Used</span>')
