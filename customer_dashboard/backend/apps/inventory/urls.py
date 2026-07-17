from django.urls import path
from .views import ProductInventoryView, InventoryStatsView

urlpatterns = [
    # Dashboard aggregate stats (must be before slug-based URL)
    path("products/inventory-stats/", InventoryStatsView.as_view(), name="inventory-stats"),
    # Nested under products: /api/v1/products/{slug}/inventory/
    path("products/<slug:slug>/inventory/", ProductInventoryView.as_view(), name="product-inventory"),
]
