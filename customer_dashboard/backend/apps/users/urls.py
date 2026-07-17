"""
FAAZO – Users URL Routing

All routes prefixed with /api/v1/users/ (configured in config/urls.py).

Endpoints:
    GET    profile/                   — Get own profile
    PATCH  profile/                   — Partial update profile
    POST   profile/avatar/            — Upload avatar
    DELETE profile/avatar/            — Remove avatar
    GET    addresses/                 — List all addresses
    POST   addresses/                 — Create address
    GET    addresses/{id}/            — Get single address
    PATCH  addresses/{id}/            — Update address
    DELETE addresses/{id}/            — Delete address
    POST   addresses/{id}/set-default/ — Set as default
"""

from django.urls import path

from apps.users.views import AddressViewSet, AvatarView, UserProfileView, CustomerAdminViewSet

app_name = "users"

# Address ViewSet actions
_addr = AddressViewSet.as_view
_cust = CustomerAdminViewSet.as_view

urlpatterns = [
    # ── Profile ──────────────────────────────────────────────────
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("profile/avatar/", AvatarView.as_view(), name="avatar"),

    # ── Addresses ────────────────────────────────────────────────
    path(
        "addresses/",
        _addr({"get": "list", "post": "create"}),
        name="address-list",
    ),
    path(
        "addresses/<uuid:pk>/",
        _addr({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="address-detail",
    ),
    path(
        "addresses/<uuid:pk>/set-default/",
        _addr({"post": "set_default"}),
        name="address-set-default",
    ),

    # ── Admin Customer Management ──────────────────────────────
    path(
        "admin/customers/",
        _cust({"get": "list"}),
        name="admin-customer-list",
    ),
    path(
        "admin/customers/stats/",
        _cust({"get": "stats"}),
        name="admin-customer-stats",
    ),
    path(
        "admin/customers/<uuid:pk>/",
        _cust({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="admin-customer-detail",
    ),
    path(
        "admin/customers/<uuid:pk>/block/",
        _cust({"post": "block"}),
        name="admin-customer-block",
    ),
    path(
        "admin/customers/<uuid:pk>/unblock/",
        _cust({"post": "unblock"}),
        name="admin-customer-unblock",
    ),
    path(
        "admin/customers/<uuid:pk>/deactivate/",
        _cust({"post": "deactivate"}),
        name="admin-customer-deactivate",
    ),
    path(
        "admin/customers/<uuid:pk>/activate/",
        _cust({"post": "activate"}),
        name="admin-customer-activate",
    ),
]
