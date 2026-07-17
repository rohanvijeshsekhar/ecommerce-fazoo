"""
FAAZO – Authentication Services Layer

Production business logic for all authentication operations.
Views and serializers contain NO business logic — they delegate here.

Services
--------
TokenService
    Generates and validates cryptographically secure one-time tokens
    for email verification and password reset.
    Strategy: secrets.token_hex(32) → SHA-256 hash stored in DB.

JWTService
    Wraps SimpleJWT for clean token pair generation, blacklisting,
    and full-session invalidation on password reset.

EmailService
    Sends all transactional emails using Django's EmailMultiAlternatives.
    Renders HTML + plain-text templates from templates/emails/.

AuthService
    Core authentication logic: account lockout tracking, password
    change with full session cleanup.

Architecture Rules
------------------
- Services are stateless: all methods are @classmethod or @staticmethod.
- Services raise no HTTP exceptions — they return typed results.
- Views translate service results into HTTP responses.
- All external I/O (DB, cache, email) is inside services, never in views.
"""

import hashlib
import logging
import secrets
from datetime import timedelta
from typing import Optional, Tuple

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.authentication.models import EmailVerificationToken, PasswordResetToken

logger = logging.getLogger("faazo.auth")
User = get_user_model()


# ============================================================
# TokenService — Cryptographically Secure One-Time Tokens
# ============================================================

class TokenService:
    """
    Generates and validates secure one-time tokens.

    Token Strategy
    --------------
    Generation:
        raw_token  = secrets.token_hex(32)   → 64-character hex string
        token_hash = SHA-256(raw_token)       → 64-character hex digest (stored in DB)

    Validation:
        Received raw_token → hash it → query DB by hash → validate state

    Security guarantees:
        - Raw token never touches the database.
        - SHA-256 is a one-way function: DB compromise does not expose raw tokens.
        - Old unused tokens invalidated before new ones are created (no stale links).
        - Tokens are time-limited and single-use.
    """

    TOKEN_BYTES = 32  # 32 bytes → 64 hex chars

    @classmethod
    def _hash_token(cls, raw_token: str) -> str:
        """Return SHA-256 hex digest of raw token."""
        return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    # ── Email Verification ───────────────────────────────────────

    @classmethod
    def generate_email_verification_token(cls, user) -> str:
        """
        Create a new EmailVerificationToken for a user.

        Any existing unused tokens for this user are invalidated first,
        preventing multiple valid links from existing simultaneously.

        Returns:
            raw_token (str): To be embedded in the email link.
        """
        # Invalidate all existing unused tokens for this user
        EmailVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)

        raw_token = secrets.token_hex(cls.TOKEN_BYTES)
        token_hash = cls._hash_token(raw_token)

        EmailVerificationToken.objects.create(
            user=user,
            token_hash=token_hash,
        )

        logger.info("Email verification token generated for %s", user.email)
        return raw_token

    @classmethod
    def verify_email_token(
        cls, raw_token: str
    ) -> Tuple[bool, str, Optional[object]]:
        """
        Validate a raw email verification token.

        Steps:
            1. Hash the raw token.
            2. Look up EmailVerificationToken by hash.
            3. Check is_used and is_expired.
            4. Mark token as used, mark user email as verified.

        Returns:
            (success: bool, message: str, user_or_None)
        """
        token_hash = cls._hash_token(raw_token)

        try:
            token_obj = EmailVerificationToken.objects.select_related("user").get(
                token_hash=token_hash
            )
        except EmailVerificationToken.DoesNotExist:
            logger.warning("Email verification attempt with unknown token hash.")
            return False, "Invalid or expired verification link.", None

        if token_obj.is_used:
            return False, "This verification link has already been used.", None

        if token_obj.is_expired:
            return (
                False,
                "This verification link has expired. Please request a new one.",
                None,
            )

        # Consume the token
        token_obj.is_used = True
        token_obj.save(update_fields=["is_used"])

        # Verify the user's email
        user = token_obj.user
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified", "updated_at"])

        logger.info("Email verified successfully for user %s", user.email)
        return True, "Email address verified successfully.", user

    # ── Password Reset ───────────────────────────────────────────

    @classmethod
    def generate_password_reset_token(cls, user) -> str:
        """
        Create a new PasswordResetToken for a user.

        Any existing unused reset tokens are invalidated first.

        Returns:
            raw_token (str): To be embedded in the password reset email link.
        """
        # Invalidate all existing unused reset tokens
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

        raw_token = secrets.token_hex(cls.TOKEN_BYTES)
        token_hash = cls._hash_token(raw_token)

        PasswordResetToken.objects.create(
            user=user,
            token_hash=token_hash,
        )

        logger.info("Password reset token generated for %s", user.email)
        return raw_token

    @classmethod
    def validate_password_reset_token(
        cls, raw_token: str
    ) -> Tuple[bool, str, Optional[PasswordResetToken]]:
        """
        Validate a raw password reset token WITHOUT consuming it.

        Use this to check token validity before accepting the new password.
        Call consume_password_reset_token() after the password is saved.

        Returns:
            (success: bool, message: str, token_obj_or_None)
        """
        token_hash = cls._hash_token(raw_token)

        try:
            token_obj = PasswordResetToken.objects.select_related("user").get(
                token_hash=token_hash
            )
        except PasswordResetToken.DoesNotExist:
            return False, "Invalid or expired reset link.", None

        if token_obj.is_used:
            return False, "This reset link has already been used.", None

        if token_obj.is_expired:
            return False, "This reset link has expired. Please request a new one.", None

        return True, "Token is valid.", token_obj

    @classmethod
    def consume_password_reset_token(cls, token_obj: PasswordResetToken) -> None:
        """
        Mark a password reset token as used after the password has been saved.
        Always call this AFTER successfully updating the password.
        """
        token_obj.is_used = True
        token_obj.used_at = timezone.now()
        token_obj.save(update_fields=["is_used", "used_at"])
        logger.info(
            "Password reset token consumed for user %s", token_obj.user.email
        )


# ============================================================
# JWTService — Access & Refresh Token Management
# ============================================================

class JWTService:
    """
    Wraps SimpleJWT to provide a clean, testable interface for
    token pair generation, individual blacklisting, and full
    session invalidation on password reset.

    Configuration (from settings/base.py):
        ACCESS_TOKEN_LIFETIME:  15 minutes
        REFRESH_TOKEN_LIFETIME:  7 days (14 days with remember_me)
        ROTATE_REFRESH_TOKENS:  True
        BLACKLIST_AFTER_ROTATION: True
    """

    @staticmethod
    def generate_tokens_for_user(user, remember_me: bool = False) -> dict:
        """
        Generate a JWT access + refresh token pair for a user.

        Args:
            user: Authenticated User instance.
            remember_me: If True, refresh token lifetime extends to 14 days.

        Returns:
            {"access": str, "refresh": str}
        """
        refresh = RefreshToken.for_user(user)

        if remember_me:
            # Override the refresh token expiry to 14 days
            refresh.set_exp(lifetime=timedelta(days=14))

        tokens = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }

        logger.info(
            "JWT token pair generated for %s (remember_me=%s)",
            user.email,
            remember_me,
        )
        return tokens

    @staticmethod
    def blacklist_refresh_token(refresh_token_str: str) -> Tuple[bool, str]:
        """
        Blacklist a single refresh token (called on logout).

        Returns:
            (success: bool, message: str)
        """
        try:
            token = RefreshToken(refresh_token_str)
            token.blacklist()
            logger.info("Refresh token blacklisted on logout.")
            return True, "Logged out successfully."
        except TokenError as exc:
            logger.warning("Token blacklist failed: %s", str(exc))
            return False, "Invalid or already expired token."

    @staticmethod
    def blacklist_all_user_tokens(user) -> int:
        """
        Blacklist ALL outstanding refresh tokens for a user.

        Called when:
        - User changes their password
        - User resets their password via email link
        - Admin deactivates an account

        This forces re-authentication on all devices.

        Returns:
            Number of tokens blacklisted.
        """
        from rest_framework_simplejwt.token_blacklist.models import (
            BlacklistedToken,
            OutstandingToken,
        )

        outstanding = OutstandingToken.objects.filter(
            user=user,
            expires_at__gt=timezone.now(),
        )

        count = 0
        for token in outstanding:
            _, created = BlacklistedToken.objects.get_or_create(token=token)
            if created:
                count += 1

        logger.info(
            "Blacklisted %d outstanding JWT tokens for %s (forced re-login).",
            count,
            user.email,
        )
        return count


# ============================================================
# EmailService — Transactional Email Dispatch
# ============================================================

class EmailService:
    """
    Sends all FAAZO transactional emails.

    Template location: templates/emails/{template_name}.html
                                       templates/emails/{template_name}.txt

    Both HTML and plain-text variants are sent for maximum compatibility.
    Falls back to plain-text for email clients that block HTML.

    All methods return bool (True = sent, False = error).
    Email send failures are logged but never raise exceptions to callers.
    """

    @classmethod
    def _send(
        cls,
        to_email: str,
        subject: str,
        template_name: str,
        context: dict,
    ) -> bool:
        """
        Internal dispatcher. Renders HTML + TXT templates and sends email.
        """
        # Inject global context available to all templates
        context.setdefault("frontend_url", settings.FRONTEND_URL)
        context.setdefault("support_email", "support@faazo.com")
        context.setdefault("current_year", timezone.now().year)

        try:
            html_content = render_to_string(f"emails/{template_name}.html", context)
            text_content = render_to_string(f"emails/{template_name}.txt", context)

            message = EmailMultiAlternatives(
                subject=f"FAAZO – {subject}",
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[to_email],
            )
            message.attach_alternative(html_content, "text/html")
            message.send(fail_silently=False)

            logger.info("Email [%s] dispatched to %s", template_name, to_email)
            return True

        except Exception as exc:  # noqa: BLE001
            logger.error(
                "Email [%s] to %s FAILED: %s",
                template_name,
                to_email,
                str(exc),
                exc_info=True,
            )
            return False

    # ── Public Email Methods ─────────────────────────────────────

    @classmethod
    def send_welcome_verify(cls, user, raw_token: str) -> bool:
        """
        Welcome email sent immediately after customer registration.
        Includes email verification link (24h expiry).
        """
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={raw_token}"
        return cls._send(
            to_email=user.email,
            subject="Welcome to FAAZO – Verify Your Email",
            template_name="welcome_verify",
            context={
                "user": user,
                "verify_url": verify_url,
                "expires_hours": 24,
            },
        )

    @classmethod
    def send_verification_email(cls, user, raw_token: str) -> bool:
        """
        Standalone verify email — used for resend verification requests.
        """
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={raw_token}"
        return cls._send(
            to_email=user.email,
            subject="Verify Your Email Address",
            template_name="email_verify",
            context={
                "user": user,
                "verify_url": verify_url,
                "expires_hours": 24,
            },
        )

    @classmethod
    def send_password_reset(cls, user, raw_token: str) -> bool:
        """
        Password reset email. Contains a secure link (1h expiry).
        """
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
        return cls._send(
            to_email=user.email,
            subject="Password Reset Request",
            template_name="password_reset",
            context={
                "user": user,
                "reset_url": reset_url,
                "expires_hours": 1,
            },
        )

    @classmethod
    def send_password_reset_success(cls, user) -> bool:
        """
        Confirmation email sent after a successful password reset.
        Alerts the user in case the reset was not initiated by them.
        """
        return cls._send(
            to_email=user.email,
            subject="Your Password Has Been Changed",
            template_name="password_reset_success",
            context={"user": user},
        )

    @classmethod
    def send_dealer_application_received(cls, user, company_name: str) -> bool:
        """
        Confirmation sent after dealer registration submission.
        Explains the review process and timeline.
        """
        return cls._send(
            to_email=user.email,
            subject="Dealer Application Received",
            template_name="dealer_received",
            context={"user": user, "company_name": company_name},
        )

    @classmethod
    def send_dealer_approved(cls, user, company_name: str) -> bool:
        """
        Sent when admin approves a dealer application.
        Informs the dealer that dealer pricing is now active.
        """
        return cls._send(
            to_email=user.email,
            subject="Your Dealer Account Has Been Approved",
            template_name="dealer_approved",
            context={"user": user, "company_name": company_name},
        )

    @classmethod
    def send_dealer_rejected(
        cls, user, company_name: str, rejection_reason: str = ""
    ) -> bool:
        """
        Sent when admin rejects a dealer application.
        Includes the rejection reason if provided.
        """
        return cls._send(
            to_email=user.email,
            subject="Dealer Application Update",
            template_name="dealer_rejected",
            context={
                "user": user,
                "company_name": company_name,
                "rejection_reason": rejection_reason,
            },
        )


# ============================================================
# AuthService — Core Authentication Logic
# ============================================================

_LOCKOUT_PREFIX = "faazo:login_fail:"


class AuthService:
    """
    Core authentication business logic.

    Responsibilities:
    - Account lockout tracking (failed login attempts → time-based lockout)
    - Secure password change with forced session invalidation
    - Password strength check helpers

    Phone Verification (v2.0):
    - phone_number and is_phone_verified fields exist on User model.
    - OTP generation and validation will be added in a future release.
    - This service is architected to accept an OTP service as a dependency
      without requiring changes to the auth flow structure.
    """

    # ── Lockout Management ───────────────────────────────────────

    @staticmethod
    def _lockout_cache_key(email: str) -> str:
        """Generate a per-email cache key for lockout tracking."""
        return f"{_LOCKOUT_PREFIX}{email.lower().strip()}"

    @classmethod
    def is_account_locked(cls, email: str) -> Tuple[bool, int]:
        """
        Check if an account is currently locked.

        Returns:
            (is_locked: bool, seconds_remaining: int)
        """
        key = cls._lockout_cache_key(email)
        data = cache.get(key)

        if data is None:
            return False, 0

        attempts = data.get("attempts", 0)
        max_attempts = getattr(settings, "LOGIN_FAIL_MAX_ATTEMPTS", 5)

        if attempts >= max_attempts:
            # Approximate TTL — cache.ttl() is available on Redis/Memcached backends
            ttl = getattr(cache, "ttl", lambda k: 0)(key)
            return True, max(int(ttl), 0)

        return False, 0

    @classmethod
    def record_failed_login(cls, email: str) -> int:
        """
        Increment the failed login attempt counter for an email.

        Returns:
            Current total failed attempts for this email.
        """
        key = cls._lockout_cache_key(email)
        lockout_window = getattr(settings, "LOGIN_FAIL_LOCKOUT_MINUTES", 15) * 60
        max_attempts = getattr(settings, "LOGIN_FAIL_MAX_ATTEMPTS", 5)

        data = cache.get(key) or {"attempts": 0}
        data["attempts"] += 1
        cache.set(key, data, timeout=lockout_window)

        attempts = data["attempts"]

        if attempts >= max_attempts:
            logger.warning(
                "[SECURITY] Account locked: %s — %d failed attempts.",
                email,
                attempts,
            )
        else:
            logger.info(
                "Failed login attempt %d/%d for %s.",
                attempts,
                max_attempts,
                email,
            )

        return attempts

    @classmethod
    def clear_failed_attempts(cls, email: str) -> None:
        """
        Clear the failed login counter after a successful login.
        Call this immediately after a valid credential is confirmed.
        """
        key = cls._lockout_cache_key(email)
        cache.delete(key)
        logger.debug("Failed login counter cleared for %s.", email)

    # ── Password Operations ──────────────────────────────────────

    @staticmethod
    def change_password(user, new_password: str) -> None:
        """
        Securely change a user's password.

        Steps:
            1. Hash and set the new password (Argon2).
            2. Save the user record.
            3. Blacklist ALL outstanding JWT tokens (forces re-login everywhere).

        Always use this method — never call user.set_password() directly in views.
        """
        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])
        JWTService.blacklist_all_user_tokens(user)
        logger.info(
            "Password changed for %s. All tokens invalidated.",
            user.email,
        )

    # ── Phone Verification Stub (v2.0) ───────────────────────────
    # The following methods are intentionally left as stubs.
    # They define the interface that the OTP service will implement
    # in v2.0 without requiring any changes to the auth flow.

    @staticmethod
    def send_phone_otp(user) -> bool:  # noqa: ANN001
        """
        [v2.0 STUB] Send a mobile OTP to the user's phone_number.

        When PHONE_VERIFICATION_ENABLED = True in settings:
            - Generate a 6-digit TOTP or random OTP
            - Send via configured SMS gateway (e.g. MSG91, Twilio)
            - Store OTP hash in cache with 10-minute TTL

        Currently returns False (not implemented).
        """
        if not getattr(settings, "PHONE_VERIFICATION_ENABLED", False):
            logger.debug(
                "Phone verification disabled (PHONE_VERIFICATION_ENABLED=False). "
                "OTP not sent for %s.",
                user.email,
            )
            return False

        # TODO(v2.0): Implement SMS dispatch here
        raise NotImplementedError(
            "Phone OTP verification will be implemented in v2.0. "
            "Set PHONE_VERIFICATION_ENABLED=False for now."
        )

    @staticmethod
    def verify_phone_otp(user, otp: str) -> bool:  # noqa: ANN001
        """
        [v2.0 STUB] Validate a mobile OTP and set is_phone_verified=True.

        Currently returns False (not implemented).
        """
        if not getattr(settings, "PHONE_VERIFICATION_ENABLED", False):
            return False

        # TODO(v2.0): Implement OTP validation here
        raise NotImplementedError("Phone OTP verification will be implemented in v2.0.")
