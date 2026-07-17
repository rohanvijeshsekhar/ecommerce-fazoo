"""
FAAZO – Dealer URL Routing

All routes prefixed with /api/v1/dealer/ (configured in config/urls.py).

Note: Dealer REGISTRATION is handled at /api/v1/auth/dealer/register/
      (in apps.authentication) because it involves user creation.

Endpoints:
    GET  status/                          — Dealer views their own application status

    Admin endpoints (IsAdmin required):
    GET    admin/applications/            — List all applications (with filters)
    GET    admin/applications/stats/      — Dashboard summary counts
    GET    admin/applications/<pk>/       — Application detail
    PATCH  admin/applications/<pk>/       — Update admin notes
    POST   admin/applications/<pk>/approve/   — Approve application
    POST   admin/applications/<pk>/reject/    — Reject with reason
"""

from django.urls import path

from apps.dealer.views import DealerStatusView, DealerAdminViewSet

app_name = "dealer"

_admin = DealerAdminViewSet.as_view

urlpatterns = [
    # ── Dealer-facing ─────────────────────────────────────────────
    path("status/", DealerStatusView.as_view(), name="dealer-status"),

    # ── Admin — Dealer Application Management ────────────────────
    path(
        "admin/applications/",
        _admin({"get": "list"}),
        name="admin-dealer-list",
    ),
    path(
        "admin/applications/stats/",
        _admin({"get": "stats"}),
        name="admin-dealer-stats",
    ),
    path(
        "admin/applications/<uuid:pk>/",
        _admin({"get": "retrieve", "patch": "partial_update"}),
        name="admin-dealer-detail",
    ),
    path(
        "admin/applications/<uuid:pk>/approve/",
        _admin({"post": "approve"}),
        name="admin-dealer-approve",
    ),
    path(
        "admin/applications/<uuid:pk>/reject/",
        _admin({"post": "reject"}),
        name="admin-dealer-reject",
    ),
]
