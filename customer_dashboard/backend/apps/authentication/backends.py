"""
FAAZO – Email Authentication Backend

Replaces Django's default ModelBackend.
Authenticates users by email (case-insensitive) instead of username.

Full implementation used by Phase 3 login flow.
"""

import logging

from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

logger = logging.getLogger("faazo.auth")


class EmailAuthBackend(ModelBackend):
    """
    Authenticate using email address (case-insensitive).

    Falls back to Django's default permission and session logic
    via ModelBackend parent class.
    """

    def authenticate(self, request, email: str = None, password: str = None, **kwargs):
        if not email or not password:
            return None

        from apps.users.models import User

        try:
            # Case-insensitive email lookup
            user = User.objects.get(Q(email__iexact=email))
        except User.DoesNotExist:
            # Run the hasher to mitigate timing attacks
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            # Should never happen — email is unique. Log and fail safely.
            logger.error("Multiple users found for email %s — database integrity issue", email)
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None

    def get_user(self, user_id):
        from apps.users.models import User
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None


from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class FAAZOJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication class that checks if a user is blocked or soft-deleted.
    """
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if user is None:
            return None
        
        profile = getattr(user, "profile", None)
        if profile:
            if profile.is_blocked:
                raise AuthenticationFailed("This account has been blocked by an administrator.", code="user_blocked")
            if profile.is_deleted:
                raise AuthenticationFailed("This account has been deleted.", code="user_deleted")
        
        return user
