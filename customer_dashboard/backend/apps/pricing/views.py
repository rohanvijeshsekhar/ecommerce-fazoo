"""
FAAZO – Pricing Views (Phase 6A)

Endpoints:
  GET    /api/v1/products/{slug}/pricing/   → retrieve pricing
  PATCH  /api/v1/products/{slug}/pricing/   → update pricing (admin)

Auto-creates a ProductPricing record if one does not exist.
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView

from apps.common.permissions import IsAdmin
from apps.common.responses import success_response, error_response
from apps.products.models import Product

from .models import ProductPricing
from .serializers import ProductPricingSerializer


class ProductPricingView(APIView):
    """
    Retrieve or update pricing for a single product.

    - GET  — Public (any user can see selling price / effective price).
             Dealer price is stripped at serializer level for non-dealers.
    - PATCH — Admin only.
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsAdmin()]

    def _get_product(self, slug):
        try:
            return Product.all_objects.select_related("pricing").get(slug=slug)
        except Product.DoesNotExist:
            return None

    def _get_or_create_pricing(self, product):
        """Return existing pricing or create a blank one."""
        pricing, _ = ProductPricing.objects.get_or_create(product=product)
        return pricing

    def get(self, request, slug):
        product = self._get_product(slug)
        if not product:
            return error_response("Product not found.", status_code=status.HTTP_404_NOT_FOUND)

        pricing = self._get_or_create_pricing(product)
        serializer = ProductPricingSerializer(pricing, context={"request": request})
        return success_response(data=serializer.data)

    def patch(self, request, slug):
        product = self._get_product(slug)
        if not product:
            return error_response("Product not found.", status_code=status.HTTP_404_NOT_FOUND)

        pricing = self._get_or_create_pricing(product)
        serializer = ProductPricingSerializer(pricing, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return success_response(data=serializer.data, message="Pricing updated.")
