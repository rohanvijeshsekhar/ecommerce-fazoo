"""
FAAZO – Shared Model Mixins & Abstract Base Models

All FAAZO domain models inherit from one of these abstract classes.
Never duplicate timestamp, UUID, soft-delete, or audit fields across apps.

Hierarchy:
  UUIDPrimaryKeyMixin  ← UUID pk
  TimestampMixin       ← created_at, updated_at
  SoftDeleteMixin      ← is_deleted, deleted_at, deleted_by
  AuditMixin           ← created_by, updated_by

Compound classes (for convenience):
  BaseModel            ← UUID + Timestamps  (most common)
  AuditedModel         ← UUID + Timestamps + Audit
  FullAuditModel       ← UUID + Timestamps + Audit + SoftDelete  (sensitive data)
"""

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

# ============================================================
# Primitive Mixins
# ============================================================


class UUIDPrimaryKeyMixin(models.Model):
    """
    Replaces default integer PK with UUID.

    Benefits:
    - Prevents enumeration attacks on API resources.
    - Safe to expose in public URLs.
    - Globally unique across tables (useful for distributed systems later).
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_index=True,
        verbose_name="ID",
    )

    class Meta:
        abstract = True


class TimestampMixin(models.Model):
    """
    Adds created_at and updated_at to every model automatically.
    Both fields are indexed for efficient time-range queries.
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="Created At",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Updated At",
    )

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class SoftDeleteMixin(models.Model):
    """
    Enables soft deletion — records are never physically removed.

    When delete() is called:
    - is_deleted = True
    - deleted_at = now()
    - deleted_by = current user (if provided)

    The ActiveManager automatically excludes soft-deleted records.
    Use Model.all_objects.all() to include deleted records.

    Hard deletion is available via Model.all_objects.hard_delete().
    """

    is_deleted = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Is Deleted",
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Deleted At",
    )
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_deleted",
        verbose_name="Deleted By",
    )

    class Meta:
        abstract = True

    def delete(self, deleted_by=None, using=None, keep_parents=False):
        """Soft delete – marks the record as deleted without removing it."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        if deleted_by is not None:
            self.deleted_by = deleted_by
        self.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])

    def hard_delete(self, using=None, keep_parents=False):
        """Permanently delete the record from the database."""
        super().delete(using=using, keep_parents=keep_parents)

    def restore(self):
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])


class AuditMixin(models.Model):
    """
    Tracks which user created and last updated a record.

    Both fields are optional (null=True) to support:
    - System-generated records (no request user)
    - Records created before auth was implemented
    - Future programmatic creation flows
    """

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_created",
        verbose_name="Created By",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_updated",
        verbose_name="Updated By",
    )

    class Meta:
        abstract = True


# ============================================================
# Compound Base Models (use these in domain apps)
# ============================================================


class BaseModel(UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Standard base for most FAAZO entities.

    Provides:
    - UUID primary key
    - created_at / updated_at timestamps

    Use for: Products, Categories, Brands, Cart, Orders, etc.
    """

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class AuditedModel(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin):
    """
    Base for entities that need a full audit trail.

    Provides:
    - UUID primary key
    - created_at / updated_at timestamps
    - created_by / updated_by foreign keys

    Use for: Pricing rules, Inventory adjustments, Coupon administration.
    """

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class FullAuditModel(UUIDPrimaryKeyMixin, TimestampMixin, AuditMixin, SoftDeleteMixin):
    """
    Base for sensitive entities requiring full audit + soft delete.

    Provides:
    - UUID primary key
    - created_at / updated_at timestamps
    - created_by / updated_by foreign keys
    - Soft delete (is_deleted, deleted_at, deleted_by)

    Use for: Users, Dealer applications, Warranty records, Orders.

    IMPORTANT: Models inheriting from this MUST use SoftDeleteManager
    as their default manager to ensure deleted records are excluded.
    """

    class Meta:
        abstract = True
        ordering = ["-created_at"]
