"""
FAAZO – User Signals

post_save on User:
    Automatically creates a UserProfile when a new User is created.
    Uses get_or_create to be safe against duplicate signal fires.
"""

import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger("faazo.auth")


def get_user_model_lazy():
    """Lazy import to avoid circular imports at module load time."""
    from apps.users.models import User, UserProfile
    return User, UserProfile


@receiver(post_save, sender="users.User")
def create_user_profile(sender, instance, created: bool, **kwargs):
    """
    Create a UserProfile automatically when a new User is saved for the first time.
    """
    if not created:
        return

    _, UserProfile = get_user_model_lazy()
    profile, was_created = UserProfile.objects.get_or_create(user=instance)

    if was_created:
        logger.info(
            "UserProfile created for user %s (role=%s)",
            instance.email,
            instance.role,
        )
