"""
FAAZO – Custom Django Model Managers

Every model using SoftDeleteMixin MUST declare:

    objects = ActiveManager()
    all_objects = SoftDeleteManager()

This ensures:
- Default querysets never return soft-deleted records.
- Deleted records are accessible when explicitly needed (admin, restore).
- Hard deletion is available but protected behind an explicit API.
"""

from django.db import models
from django.utils import timezone

# ============================================================
# QuerySet
# ============================================================


class SoftDeleteQuerySet(models.QuerySet):
    """
    Custom QuerySet providing soft delete operations.

    Methods
    -------
    active()
        Returns only non-deleted records.
    deleted()
        Returns only deleted records.
    delete(deleted_by=None)
        Soft-deletes all records in the queryset.
    hard_delete()
        Permanently removes all records in the queryset.
    restore()
        Restores all soft-deleted records in the queryset.
    """

    def active(self):
        """Filter to non-deleted records only."""
        return self.filter(is_deleted=False)

    def deleted(self):
        """Filter to soft-deleted records only."""
        return self.filter(is_deleted=True)

    def delete(self, deleted_by=None):
        """Soft-delete all records in this queryset."""
        now = timezone.now()
        kwargs = {"is_deleted": True, "deleted_at": now}
        if deleted_by is not None:
            kwargs["deleted_by"] = deleted_by
        return self.update(**kwargs)

    def hard_delete(self):
        """Permanently remove all records in this queryset from the database."""
        return super().delete()

    def restore(self):
        """Restore all soft-deleted records in this queryset."""
        return self.update(is_deleted=False, deleted_at=None, deleted_by=None)


# ============================================================
# Managers
# ============================================================


class ActiveManager(models.Manager):
    """
    Default manager for soft-delete models.

    Automatically excludes soft-deleted records from all queries.

    Usage:
        class MyModel(FullAuditModel):
            objects = ActiveManager()          # default
            all_objects = SoftDeleteManager() # includes deleted
    """

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).active()

    def active(self):
        return self.get_queryset()

    def deleted(self):
        """Access deleted records via the active manager — explicit API."""
        return SoftDeleteQuerySet(self.model, using=self._db).deleted()


class SoftDeleteManager(models.Manager):
    """
    Unfiltered manager that includes all records (active + deleted).

    Attach to models as `all_objects`:

        all_objects = SoftDeleteManager()

    Then use:
        Model.all_objects.all()          → all records
        Model.all_objects.active()       → non-deleted only
        Model.all_objects.deleted()      → deleted only
        Model.all_objects.restore()      → restore queryset
        Model.all_objects.hard_delete()  → permanent removal
    """

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()

    def deleted(self):
        return self.get_queryset().deleted()
