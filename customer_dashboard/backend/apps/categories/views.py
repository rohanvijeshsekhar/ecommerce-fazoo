"""
FAAZO – Category Views
"""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.common.viewsets import BaseModelViewSet
from apps.common.permissions import IsAdmin
from apps.common.responses import success_response, error_response

from .models import Category
from .serializers import (
    CategoryListSerializer,
    CategoryDetailSerializer,
    CategoryTreeSerializer,
    CategoryWriteSerializer,
)


class CategoryViewSet(BaseModelViewSet):
    """
    CRUD for Categories with tree support.

    - Public: list + retrieve + tree (read-only)
    - Admin: full CRUD including re-parenting
    """

    lookup_field = "slug"

    filterset_fields = ["is_active", "parent"]
    search_fields    = ["name", "slug", "description"]
    ordering_fields  = ["sort_order", "name", "created_at"]
    ordering         = ["sort_order", "name"]

    def get_queryset(self):
        qs = Category.objects.select_related("parent")
        if not (self.request.user.is_authenticated and self.request.user.role == "admin"):
            qs = qs.filter(is_active=True)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve", "tree"):
            return [AllowAny()]
        return [IsAuthenticated(), IsAdmin()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return CategoryWriteSerializer
        if self.action == "tree":
            return CategoryTreeSerializer
        if self.action == "retrieve":
            return CategoryDetailSerializer
        return CategoryListSerializer

    def perform_create(self, serializer):
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete — only if no active products or children are attached.
        """
        category = self.get_object()
        if category.children.filter(is_active=True).exists():
            return error_response(
                "Cannot delete a category that has active subcategories. "
                "Delete or deactivate child categories first.",
                status_code=status.HTTP_409_CONFLICT,
            )
        if category.products.filter(is_deleted=False).exists():
            return error_response(
                "Cannot delete a category that has products. "
                "Reassign or archive all products first.",
                status_code=status.HTTP_409_CONFLICT,
            )
        category.is_active = False
        category.save(update_fields=["is_active"])
        return success_response(message="Category deactivated.")

    @action(detail=False, methods=["get"], url_path="tree",
            permission_classes=[AllowAny])
    def tree(self, request):
        """
        GET /api/v1/categories/tree/
        Returns the full nested category tree for storefront menus and admin UI.
        Only root-level (parent=None) active categories are returned;
        children are nested recursively.
        """
        roots = Category.objects.filter(
            parent=None, is_active=True
        ).order_by("sort_order", "name")
        serializer = CategoryTreeSerializer(roots, many=True, context={"request": request})
        return success_response(data=serializer.data)

    @action(detail=False, methods=["get"], url_path="dropdown",
            permission_classes=[IsAuthenticated])
    def dropdown(self, request):
        """
        GET /api/v1/categories/dropdown/
        Flat indented list for admin form selects. Shows full_path.
        """
        qs = Category.objects.filter(is_active=True).order_by("sort_order", "name")
        data = [
            {
                "id": str(cat.id),
                "name": cat.name,
                "slug": cat.slug,
                "full_path": cat.full_path,
                "depth": cat.depth,
                "parent": str(cat.parent_id) if cat.parent_id else None,
            }
            for cat in qs
        ]
        return success_response(data=data)
