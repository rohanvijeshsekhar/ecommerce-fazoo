"""
FAAZO – Authentication Token Models

EmailVerificationToken
    One-time token for verifying a user's email address.
    Expires 24 hours after creation.

PasswordResetToken
    One-time token for password reset flows.
    Expires 1 hour after creation.

Security Strategy:
    - Raw tokens are NEVER stored — only SHA-256 hashes are persisted.
    - Raw token lives only in the email link.
    - On validation: hash the received raw token and look up by hash.
    - Tokens are single-use (is_used=True after first successful use).
    - Old unused tokens are invalidated when a new one is generated.
"""

import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


# ============================================================
# Token Expiry Defaults (called at row creation time)
# ============================================================

def _email_token_expiry():
    """24-hour window for email verification."""
    return timezone.now() + timedelta(hours=24)


def _reset_token_expiry():
    """1-hour window for password reset — tighter for security."""
    return timezone.now() + timedelta(hours=1)


# ============================================================
# Email Verification Token
# ============================================================

class EmailVerificationToken(models.Model):
    """
    Single-use token for email address verification.

    Lifecycle:
        1. Token created → raw token emailed to user
        2. User clicks link → raw token hashed → lookup by hash
        3. Validated → is_used=True, user.is_email_verified=True
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_verification_tokens",
        verbose_name="User",
    )
    token_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        verbose_name="Token Hash (SHA-256)",
        help_text="SHA-256 hash of the raw token. Raw token is only in the email.",
    )
    expires_at = models.DateTimeField(
        default=_email_token_expiry,
        verbose_name="Expires At",
    )
    is_used = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Used",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")

    class Meta:
        db_table = "email_verification_tokens"
        verbose_name = "Email Verification Token"
        verbose_name_plural = "Email Verification Tokens"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_used"]),
        ]

    def __str__(self) -> str:
        return f"EmailVerToken({self.user.email}, used={self.is_used})"

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    @property
    def is_valid(self) -> bool:
        """True only if the token has not been used and has not expired."""
        return not self.is_used and not self.is_expired


# ============================================================
# Password Reset Token
# ============================================================

class PasswordResetToken(models.Model):
    """
    Single-use token for the password reset flow.

    Lifecycle:
        1. Token created → raw token emailed as reset link
        2. User submits reset form with raw token
        3. Raw token hashed → lookup by hash → validate
        4. is_used=True, used_at=now(), password updated
        5. All outstanding JWT tokens for the user are blacklisted
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
        verbose_name="User",
    )
    token_hash = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        verbose_name="Token Hash (SHA-256)",
    )
    expires_at = models.DateTimeField(
        default=_reset_token_expiry,
        verbose_name="Expires At",
    )
    is_used = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Used",
    )
    used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Used At",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")

    class Meta:
        db_table = "password_reset_tokens"
        verbose_name = "Password Reset Token"
        verbose_name_plural = "Password Reset Tokens"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_used"]),
        ]

    def __str__(self) -> str:
        return f"PwdResetToken({self.user.email}, used={self.is_used})"

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    @property
    def is_valid(self) -> bool:
        return not self.is_used and not self.is_expired
