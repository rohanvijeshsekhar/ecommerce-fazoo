from django.urls import path
from .views import ProductPricingView

urlpatterns = [
    # Nested under products: /api/v1/products/{slug}/pricing/
    path("products/<slug:slug>/pricing/", ProductPricingView.as_view(), name="product-pricing"),
]
