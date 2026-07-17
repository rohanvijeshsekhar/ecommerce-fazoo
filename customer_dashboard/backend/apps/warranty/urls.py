from django.urls import path
from apps.warranty.views import (
    WarrantyRegistrationListView,
    WarrantyRegistrationDetailView,
    WarrantyRegistrationSubmitView,
    ImportedProductsListView,
    WarrantyClaimListView,
    WarrantyClaimDetailView,
    AdminWarrantyDashboardView,
    AdminWarrantyRegistrationListView,
    AdminWarrantyRegistrationActionView,
    AdminWarrantyClaimListView,
    AdminWarrantyClaimDetailView,
    AdminWarrantyClaimActionView
)

urlpatterns = [
    # Customer / Dealer Endpoints
    path("registrations/", WarrantyRegistrationListView.as_view(), name="warranty-registration-list"),
    path("registrations/<uuid:pk>/", WarrantyRegistrationDetailView.as_view(), name="warranty-registration-detail"),
    path("registrations/<uuid:pk>/register/", WarrantyRegistrationSubmitView.as_view(), name="warranty-registration-submit"),
    path("imported-products/", ImportedProductsListView.as_view(), name="warranty-imported-products-list"),
    path("claims/", WarrantyClaimListView.as_view(), name="warranty-claim-list"),
    path("claims/<uuid:pk>/", WarrantyClaimDetailView.as_view(), name="warranty-claim-detail"),

    # Admin Endpoints
    path("admin/dashboard/", AdminWarrantyDashboardView.as_view(), name="warranty-admin-dashboard"),
    path("admin/registrations/", AdminWarrantyRegistrationListView.as_view(), name="warranty-admin-registration-list"),
    path("admin/registrations/<uuid:pk>/action/", AdminWarrantyRegistrationActionView.as_view(), name="warranty-admin-registration-action"),
    path("admin/claims/", AdminWarrantyClaimListView.as_view(), name="warranty-admin-claim-list"),
    path("admin/claims/<uuid:pk>/", AdminWarrantyClaimDetailView.as_view(), name="warranty-admin-claim-detail"),
    path("admin/claims/<uuid:pk>/action/", AdminWarrantyClaimActionView.as_view(), name="warranty-admin-claim-action"),
]
