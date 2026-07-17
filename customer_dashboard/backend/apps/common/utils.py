"""
FAAZO – Common Utility Functions

General-purpose helpers used across multiple apps.
Never duplicate these in individual app modules.

Functions
---------
generate_slug          → URL-safe slug from a string
generate_secure_token  → Cryptographically secure random token
generate_order_number  → Unique order reference number
get_client_ip          → Extract real client IP from request
mask_email             → Partially hide email for display
truncate_text          → Truncate long text with ellipsis
"""

import hashlib
import re
import secrets
import string
from datetime import datetime

# ============================================================
# Slug Generation
# ============================================================


def generate_slug(text: str, max_length: int = 200) -> str:
    """
    Generate a URL-safe slug from any string.

    Example:
        generate_slug("FAAZO Premium Handpiece") → "faazo-premium-handpiece"
    """
    text = text.lower().strip()
    # Replace spaces and underscores with hyphens
    text = re.sub(r"[\s_]+", "-", text)
    # Remove characters that are not alphanumeric or hyphens
    text = re.sub(r"[^\w-]", "", text)
    # Collapse multiple consecutive hyphens
    text = re.sub(r"-+", "-", text)
    # Strip leading/trailing hyphens
    text = text.strip("-")
    return text[:max_length]


# ============================================================
# Secure Token Generation
# ============================================================


def generate_secure_token(length: int = 64) -> str:
    """
    Generate a cryptographically secure URL-safe token.

    Used for:
    - Email verification tokens
    - Password reset tokens
    - API keys

    Returns a hex string of the specified byte length.
    """
    return secrets.token_hex(length // 2)


def generate_short_token(length: int = 6) -> str:
    """
    Generate a short numeric OTP token.

    Used for:
    - SMS verification codes
    - 2FA codes

    Returns a zero-padded numeric string.
    """
    return "".join(secrets.choice(string.digits) for _ in range(length))


# ============================================================
# Order Number Generation
# ============================================================


def generate_order_number(prefix: str = "FAZ") -> str:
    """
    Generate a unique, human-readable order number.

    Format: FAZ-YYYYMMDD-XXXXXXXX (8 random uppercase alphanumeric chars)
    Example: FAZ-20260622-A3B7F92C

    The date component provides chronological sorting.
    The random component prevents sequential enumeration.
    """
    date_part = datetime.now().strftime("%Y%m%d")
    random_part = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    return f"{prefix}-{date_part}-{random_part}"


# ============================================================
# Request Utilities
# ============================================================


def get_client_ip(request) -> str:
    """
    Extract the real client IP from a Django request.

    Handles X-Forwarded-For header set by Nginx/load balancers.
    Returns '0.0.0.0' as fallback.
    """
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        # The first IP in the chain is the real client
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "0.0.0.0")


def get_user_agent(request) -> str:
    """Extract user agent string from request."""
    return request.META.get("HTTP_USER_AGENT", "Unknown")


# ============================================================
# Display Utilities
# ============================================================


def mask_email(email: str) -> str:
    """
    Partially mask an email address for safe display.

    Example:
        mask_email("john.doe@gmail.com") → "jo*****@gmail.com"
    """
    if "@" not in email:
        return "***"
    local, domain = email.split("@", 1)
    visible = local[:2] if len(local) > 2 else local[0]
    masked = visible + "*" * (len(local) - len(visible))
    return f"{masked}@{domain}"


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to max_length characters, appending suffix if truncated.

    Example:
        truncate_text("A very long product description...", 20)
        → "A very long product..."
    """
    if len(text) <= max_length:
        return text
    return text[: max_length - len(suffix)] + suffix


# ============================================================
# Hashing Utilities
# ============================================================


def hash_token(token: str) -> str:
    """
    Hash a plain token for secure database storage.
    Uses SHA-256. Used for refresh token storage.
    """
    return hashlib.sha256(token.encode()).hexdigest()
