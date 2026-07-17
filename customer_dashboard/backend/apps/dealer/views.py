"""
FAAZO – Dealer Views

Views:
    DealerStatusView          GET  /api/v1/dealer/status/
        → Returns the authenticated dealer's application status.

    DealerAdminViewSet        Admin-only CRUD + approval workflow
        GET    admin/applications/                     — List all applications
        GET    admin/applications/<pk>/                — Get single application detail
        PATCH  admin/applications/<pk>/                — Update admin_notes only
        GET    admin/applications/stats/               — Summary counts
        POST   admin/applications/<pk>/approve/        — Approve application
        POST   admin/applications/<pk>/reject/         — Reject with reason
"""

import logging

from django.db.models import Q
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

from drf_spectacular.utils import OpenApiResponse, extend_schema

from apps.common.permissions import IsAdmin
from apps.dealer.models import DealerApplication, DealerStatus
from apps.dealer.serializers import DealerApplicationAdminSerializer, DealerStatusSerializer

logger = logging.getLogger("faazo.dealer")


# ──────────────────────────────────────────────────────────────
# Response helpers
# ──────────────────────────────────────────────────────────────

def _ok(data=None, message: str = "Success.", status_code: int = status.HTTP_200_OK):
    payload = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    return Response(payload, status=status_code)


def _error(message: str, errors=None, status_code: int = status.HTTP_400_BAD_REQUEST):
    payload = {"success": False, "message": message}
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)


# ──────────────────────────────────────────────────────────────
# Dealer Status (dealer-facing)
# ──────────────────────────────────────────────────────────────

@extend_schema(tags=["Dealer"])
class DealerStatusView(APIView):
    """
    GET /api/v1/dealer/status/

    Returns the current dealer's application status.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Dealer Application Status",
        responses={
            200: DealerStatusSerializer,
            403: OpenApiResponse(description="Not a dealer account."),
            404: OpenApiResponse(description="No dealer application found."),
        },
    )
    def get(self, request):
        user = request.user

        if user.role != "dealer":
            return _error(
                "This endpoint is only accessible to dealer accounts.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        try:
            application = DealerApplication.objects.get(user=user)
        except DealerApplication.DoesNotExist:
            logger.error(
                "Dealer user %s has no DealerApplication record — data integrity issue.",
                user.email,
            )
            return _error(
                "No dealer application found. Please contact support.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = DealerStatusSerializer(application)

        status_messages = {
            "pending": "Your dealer application is under review. We'll notify you within 2–3 business days.",
            "approved": "Your dealer account is active. Dealer pricing is now enabled.",
            "rejected": (
                "Your dealer application was not approved. "
                + (
                    f"Reason: {application.rejection_reason}"
                    if application.rejection_reason
                    else "Please contact support for details."
                )
            ),
        }

        message = status_messages.get(application.status, "Application status retrieved.")

        logger.info(
            "Dealer status checked for %s — status: %s.",
            user.email,
            application.status,
        )

        return _ok(
            data={
                **serializer.data,
                "can_purchase": application.status == DealerStatus.APPROVED,
            },
            message=message,
        )


# ──────────────────────────────────────────────────────────────
# Admin Panel — Dealer Applications ViewSet
# ──────────────────────────────────────────────────────────────

@extend_schema(tags=["Admin – Dealer Applications"])
class DealerAdminViewSet(ViewSet):
    """
    Admin-only ViewSet for reviewing and actioning dealer applications.

    All operations require IsAuthenticated + IsAdmin.
    No create/edit of dealer personal data — read-only review only.
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    parser_classes = [JSONParser]

    def _get_base_queryset(self):
        return DealerApplication.objects.select_related(
            "user",
            "user__profile",
            "reviewed_by",
        ).prefetch_related(
            "user__addresses",
        ).order_by("-created_at")

    def _get_application(self, pk):
        try:
            return self._get_base_queryset().get(pk=pk)
        except DealerApplication.DoesNotExist:
            return None

    # ── List ──────────────────────────────────────────────────────

    @extend_schema(
        summary="List Dealer Applications",
        responses={200: DealerApplicationAdminSerializer(many=True)},
    )
    def list(self, request):
        qs = self._get_base_queryset()

        # Search
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(user__full_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__phone_number__icontains=search) |
                Q(company_name__icontains=search) |
                Q(user__profile__gst_number__icontains=search) |
                Q(user__profile__clinic_name__icontains=search)
            )

        # Status filter
        status_param = request.query_params.get("status", "").strip()
        if status_param and status_param != "all":
            qs = qs.filter(status=status_param)

        # City filter via addresses
        city = request.query_params.get("city", "").strip()
        if city:
            qs = qs.filter(user__addresses__city__icontains=city).distinct()

        # Date range
        start_date = request.query_params.get("start_date", "").strip()
        end_date = request.query_params.get("end_date", "").strip()
        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)

        # Pagination
        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = min(100, max(1, int(request.query_params.get("page_size", 25))))
        except (ValueError, TypeError):
            page, page_size = 1, 25

        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        qs = qs[start:end]

        serializer = DealerApplicationAdminSerializer(qs, many=True, context={"request": request})
        import math
        return Response({
            "success": True,
            "data": serializer.data,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": math.ceil(total / page_size) if total else 1,
            }
        })

    # ── Retrieve ──────────────────────────────────────────────────

    @extend_schema(
        summary="Get Dealer Application Detail",
        responses={200: DealerApplicationAdminSerializer},
    )
    def retrieve(self, request, pk=None):
        application = self._get_application(pk)
        if not application:
            return _error("Dealer application not found.", status_code=404)

        serializer = DealerApplicationAdminSerializer(application, context={"request": request})
        return _ok(data=serializer.data, message="Dealer application retrieved.")

    # ── Partial Update (admin_notes only) ─────────────────────────

    @extend_schema(
        summary="Update Admin Notes",
        request=DealerApplicationAdminSerializer,
        responses={200: DealerApplicationAdminSerializer},
    )
    def partial_update(self, request, pk=None):
        application = self._get_application(pk)
        if not application:
            return _error("Dealer application not found.", status_code=404)

        # Only allow updating admin_notes
        admin_notes = request.data.get("admin_notes")
        if admin_notes is not None:
            application.admin_notes = admin_notes
            application.save(update_fields=["admin_notes", "updated_at"])

        serializer = DealerApplicationAdminSerializer(application, context={"request": request})
        return _ok(data=serializer.data, message="Admin notes updated.")

    # ── Stats ─────────────────────────────────────────────────────

    @extend_schema(summary="Dealer Application Stats")
    @action(detail=False, methods=["get"])
    def stats(self, request):
        total = DealerApplication.objects.count()
        pending = DealerApplication.objects.filter(status=DealerStatus.PENDING).count()
        approved = DealerApplication.objects.filter(status=DealerStatus.APPROVED).count()
        rejected = DealerApplication.objects.filter(status=DealerStatus.REJECTED).count()
        approval_rate = round((approved / total * 100), 1) if total > 0 else 0.0

        return _ok(data={
            "total": total,
            "pending": pending,
            "approved": approved,
            "rejected": rejected,
            "approval_rate": approval_rate,
        }, message="Stats retrieved.")

    # ── Approve ───────────────────────────────────────────────────

    @extend_schema(summary="Approve Dealer Application")
    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        application = self._get_application(pk)
        if not application:
            return _error("Dealer application not found.", status_code=404)

        if application.status == DealerStatus.APPROVED:
            return _error("This application is already approved.")

        # Promote user role to dealer
        user = application.user
        user.role = "dealer"
        user.save(update_fields=["role"])

        # Update application status
        application.status = DealerStatus.APPROVED
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.rejection_reason = ""
        application.save(update_fields=["status", "reviewed_by", "reviewed_at", "rejection_reason", "updated_at"])

        logger.info(
            "[DEALER_APPROVED] Application %s for %s approved by %s.",
            application.id, user.email, request.user.email,
        )

        serializer = DealerApplicationAdminSerializer(application, context={"request": request})
        return _ok(data=serializer.data, message=f"Dealer application for {user.full_name} approved. Dealer portal access enabled.")

    # ── Reject ────────────────────────────────────────────────────

    @extend_schema(summary="Reject Dealer Application")
    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        application = self._get_application(pk)
        if not application:
            return _error("Dealer application not found.", status_code=404)

        if application.status == DealerStatus.REJECTED:
            return _error("This application is already rejected.")

        rejection_reason = request.data.get("rejection_reason", "").strip()
        if not rejection_reason:
            return _error("A rejection reason is required.", status_code=400)

        # NOTE: The user keeps role='dealer' so they can still access the
        # dealer portal, view pricing, and browse products. Only purchasing
        # is restricted via the DealerApplication.status and the
        # IsApprovedDealer permission class.

        application.status = DealerStatus.REJECTED
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.rejection_reason = rejection_reason
        application.save(update_fields=["status", "reviewed_by", "reviewed_at", "rejection_reason", "updated_at"])

        logger.info(
            "[DEALER_REJECTED] Application %s for %s rejected by %s. Reason: %s",
            application.id, application.user.email, request.user.email, rejection_reason,
        )

        serializer = DealerApplicationAdminSerializer(application, context={"request": request})
        return _ok(data=serializer.data, message=f"Dealer application for {application.user.full_name} rejected.")
