"""
FAAZO – Common Validators

Reusable field-level validators used across serializers and forms.
All validators raise serializers.ValidationError on failure.

Validators
----------
validate_phone_number    → Indian mobile number format
validate_gst_number      → Indian GST registration number
validate_pincode         → 6-digit Indian postal code
validate_slug            → URL-safe lowercase slug
validate_file_size       → File upload size limit
validate_image_extension → Allowed image formats
"""

import re

from django.core.exceptions import ValidationError
from rest_framework import serializers

# ============================================================
# Indian-Specific Validators
# ============================================================

PHONE_REGEX = re.compile(r"^\+?91?[-\s]?[6-9]\d{9}$")
GST_REGEX = re.compile(r"^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")
PINCODE_REGEX = re.compile(r"^[1-9][0-9]{5}$")
SLUG_REGEX = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def validate_phone_number(value: str) -> str:
    """
    Validates Indian mobile phone numbers.
    Accepts: +91-9876543210, 919876543210, 9876543210
    """
    cleaned = value.strip().replace(" ", "").replace("-", "")
    if not PHONE_REGEX.match(cleaned):
        raise serializers.ValidationError(
            "Enter a valid Indian mobile number (10 digits, starting with 6-9)."
        )
    return value


def validate_gst_number(value: str) -> str:
    """
    Validates Indian GST Identification Number (GSTIN).
    Format: 22AAAAA0000A1Z5 (15 characters)
    """
    if not GST_REGEX.match(value.upper()):
        raise serializers.ValidationError(
            "Enter a valid GST Identification Number (15 characters, e.g. 22AAAAA0000A1Z5)."
        )
    return value.upper()


def validate_pincode(value: str) -> str:
    """
    Validates Indian 6-digit postal (PIN) codes.
    Must not start with 0.
    """
    if not PINCODE_REGEX.match(str(value)):
        raise serializers.ValidationError("Enter a valid 6-digit Indian PIN code.")
    return value


# ============================================================
# General Validators
# ============================================================


def validate_slug(value: str) -> str:
    """
    Validates URL-safe slugs: lowercase letters, numbers, hyphens.
    No leading/trailing hyphens, no consecutive hyphens.
    """
    if not SLUG_REGEX.match(value):
        raise serializers.ValidationError(
            "Slug must contain only lowercase letters, numbers, and hyphens."
        )
    return value


# ============================================================
# File Validators
# ============================================================

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}
MAX_IMAGE_SIZE_MB = 5
MAX_DOCUMENT_SIZE_MB = 10


def validate_image_extension(value) -> None:
    """
    Validates that uploaded files are images in an allowed format.
    """
    import os

    ext = os.path.splitext(value.name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise serializers.ValidationError(
            f"Unsupported image format '{ext}'. " f"Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}."
        )


def validate_image_size(value) -> None:
    """
    Validates that uploaded images do not exceed MAX_IMAGE_SIZE_MB.
    """
    limit = MAX_IMAGE_SIZE_MB * 1024 * 1024
    if value.size > limit:
        raise serializers.ValidationError(
            f"Image file size must not exceed {MAX_IMAGE_SIZE_MB} MB."
        )


def validate_document_size(value) -> None:
    """
    Validates that uploaded documents do not exceed MAX_DOCUMENT_SIZE_MB.
    """
    limit = MAX_DOCUMENT_SIZE_MB * 1024 * 1024
    if value.size > limit:
        raise serializers.ValidationError(
            f"Document file size must not exceed {MAX_DOCUMENT_SIZE_MB} MB."
        )


# ============================================================
# Django Model Validators (for use in model field validators=[])
# ============================================================


def django_validate_phone(value: str) -> None:
    """Django-compatible phone validator for model fields."""
    try:
        validate_phone_number(value)
    except serializers.ValidationError as e:
        raise ValidationError(e.detail)


def django_validate_gst(value: str) -> None:
    """Django-compatible GST validator for model fields."""
    try:
        validate_gst_number(value)
    except serializers.ValidationError as e:
        raise ValidationError(e.detail)
