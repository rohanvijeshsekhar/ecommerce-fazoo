"""
FAAZO – Common Permission Classes

All permission classes follow the same interface pattern.
They can be composed using DRF's permission combining:

    permission_classes = [IsAuthenticated, IsAdmin]
    permission_classes = [IsAuthenticated, IsAuthenticatedAndVerified]
    permission_classes = [IsAuthenticated, IsOwner]

Classes
-------
IsAdmin                    → User role is 'admin'
IsDealer                   → User role is 'dealer'
IsCustomer                 → User role is 'customer'
IsAdminOrReadOnly          → Admins can write; authenticated users can read
IsOwner                    → Object belongs to request.user
IsAuthenticatedAndVerified → Authenticated + email verified
IsAdminOrDealer            → Admin or Dealer
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission

# ============================================================
# Role-Based Permissions
# ============================================================


class IsAdmin(BasePermission):
    """
    Allow access only to users whose role is 'admin'.

    Relies on `request.user.role.name` — this will be wired
    to the custom User model in Phase 3.
    """

    message = "You do not have administrator privileges."

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and self._is_admin(request.user)

    @staticmethod
    def _is_admin(user) -> bool:
        # Supports both Django superuser and FAAZO role system
        if getattr(user, "is_superuser", False):
            return True
        role = getattr(user, "role", None)
        if role is None:
            return False
        role_name = getattr(role, "name", None) or str(role)
        return role_name == "admin"


class IsDealer(BasePermission):
    """Allow access only to users whose role is 'dealer'."""

    message = "This action requires an approved dealer account."

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and self._is_dealer(request.user)

    @staticmethod
    def _is_dealer(user) -> bool:
        role = getattr(user, "role", None)
        if role is None:
            return False
        role_name = getattr(role, "name", None) or str(role)
        return role_name == "dealer"


class IsCustomer(BasePermission):
    """Allow access only to users whose role is 'customer'."""

    message = "This action requires a customer account."

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and self._is_customer(request.user)

    @staticmethod
    def _is_customer(user) -> bool:
        role = getattr(user, "role", None)
        if role is None:
            return False
        role_name = getattr(role, "name", None) or str(role)
        return role_name == "customer"


class IsAdminOrDealer(BasePermission):
    """Allow access to admins or dealers."""

    message = "This action requires an admin or dealer account."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (IsAdmin._is_admin(request.user) or IsDealer._is_dealer(request.user))
        )


class IsApprovedDealer(BasePermission):
    """
    Allow purchase-related actions only for dealers whose application
    has been approved by an administrator.

    This is the backend single-source-of-truth for dealer purchasing
    permissions. The frontend may use the `can_purchase` flag returned
    in auth responses for UX purposes, but this permission class
    enforces the restriction at the API layer so it cannot be bypassed.

    Usage:
        permission_classes = [IsAuthenticated, IsApprovedDealer]
    """

    message = (
        "Your dealer account is pending approval. "
        "Purchasing is disabled until your application is approved by an administrator."
    )

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Admins bypass dealer checks (for admin-initiated orders, etc.)
        if IsAdmin._is_admin(user):
            return True

        # Non-dealers (regular customers) are allowed — this permission
        # only restricts dealers specifically.
        if not IsDealer._is_dealer(user):
            return True

        # Dealer must have an approved application
        try:
            from apps.dealer.models import DealerApplication, DealerStatus
            application = DealerApplication.objects.get(user=user)
            if application.status == DealerStatus.APPROVED:
                return True
        except DealerApplication.DoesNotExist:
            pass

        # Dealer without approved application — block
        self.message = (
            "Your dealer account is pending approval. "
            "Purchasing is disabled until your application is approved by an administrator."
        )
        return False


# ============================================================
# Object-Level Permissions
# ============================================================


class IsOwner(BasePermission):
    """
    Allow access only if the object belongs to the requesting user.

    The object must have a `user` or `owner` attribute pointing to a User.
    Views must call check_object_permissions(request, obj).
    """

    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        # Check common ownership field patterns
        for field in ("user", "owner", "customer"):
            owner = getattr(obj, field, None)
            if owner is not None:
                return owner == request.user
        return False


# ============================================================
# Composite / Convenience Permissions
# ============================================================


class IsAdminOrReadOnly(BasePermission):
    """
    Allow full access to admins; read-only access to other authenticated users.
    Safe methods: GET, HEAD, OPTIONS.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return IsAdmin._is_admin(request.user)


class IsAuthenticatedAndVerified(BasePermission):
    """
    Require both authentication AND email verification.

    An unverified user cannot access protected resources.
    The `is_email_verified` attribute will be added in Phase 3
    when the custom User model is created.
    """

    message = "Please verify your email address before continuing."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Fallback: if the attribute doesn't exist yet, treat as verified
        # (will be enforced once custom User model is in place)
        return getattr(request.user, "is_email_verified", True)
