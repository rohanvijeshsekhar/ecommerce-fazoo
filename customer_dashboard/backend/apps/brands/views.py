"""
FAAZO – Brand Views
"""

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from apps.common.viewsets import BaseModelViewSet
from apps.common.permissions import IsAdmin, IsAdminOrReadOnly
from apps.common.responses import success_response, error_response

from .models import Brand, BrandDocument
from .serializers import (
    BrandListSerializer,
    BrandDetailSerializer,
    BrandWriteSerializer,
    BrandDocumentSerializer,
)


class BrandViewSet(BaseModelViewSet):
    """
    CRUD for Brands.

    - Public / authenticated: list + retrieve (read-only)
    - Admin: full CRUD
    """

    lookup_field = "slug"
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    filterset_fields = ["is_active", "country_of_origin"]
    search_fields    = ["name", "support_email", "country_of_origin"]
    ordering_fields  = ["name", "created_at", "warranty_months_default"]
    ordering         = ["name"]

    def get_queryset(self):
        qs = Brand.objects.select_related("created_by", "updated_by").prefetch_related("documents")
        if not (self.request.user.is_authenticated and self.request.user.role == "admin"):
            qs = qs.filter(is_active=True)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAuthenticated(), IsAdmin()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return BrandWriteSerializer
        if self.action == "list":
            return BrandListSerializer
        return BrandDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Soft delete — marks as inactive + deleted."""
        brand = self.get_object()
        if brand.products.filter(is_deleted=False).exists():
            return error_response(
                "Cannot delete a brand that has active products. "
                "Archive or reassign all products first.",
                status_code=status.HTTP_409_CONFLICT,
            )
        brand.delete(deleted_by=request.user)
        return success_response(message="Brand deleted successfully.")

    @action(detail=True, methods=["post"], url_path="documents",
            permission_classes=[IsAuthenticated, IsAdmin],
            parser_classes=[MultiPartParser, FormParser])
    def upload_document(self, request, slug=None):
        """POST /api/v1/brands/{slug}/documents/ — upload a brand document."""
        brand = self.get_object()
        serializer = BrandDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(brand=brand, created_by=request.user)
        return success_response(
            data=serializer.data,
            message="Document uploaded.",
            status_code=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["delete"], url_path=r"documents/(?P<doc_id>[^/.]+)",
            permission_classes=[IsAuthenticated, IsAdmin])
    def delete_document(self, request, slug=None, doc_id=None):
        """DELETE /api/v1/brands/{slug}/documents/{doc_id}/ — delete a brand document."""
        brand = self.get_object()
        try:
            doc = brand.documents.get(id=doc_id)
        except BrandDocument.DoesNotExist:
            return error_response("Document not found.", status_code=status.HTTP_404_NOT_FOUND)
        doc.delete()
        return success_response(message="Document deleted.")

    @action(detail=False, methods=["get"], url_path="dropdown",
            permission_classes=[IsAuthenticated])
    def dropdown(self, request):
        """GET /api/v1/brands/dropdown/ — minimal list for admin form selects."""
        qs = Brand.objects.all().order_by("name").values("id", "name", "slug", "is_active")
        return success_response(data=list(qs))
