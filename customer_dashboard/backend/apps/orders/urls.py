from django.urls import path
from .views import (
    OrderListView,
    OrderDetailView,
    OrderCancelView,
    AdminOrderListView,
    AdminOrderDetailView,
    AdminOrderExportView,
)

urlpatterns = [
    # Customer endpoints
    path('', OrderListView.as_view(), name='order-list'),
    path('<uuid:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<uuid:pk>/cancel/', OrderCancelView.as_view(), name='order-cancel'),

    # Admin endpoints
    path('admin/', AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/export/', AdminOrderExportView.as_view(), name='admin-order-export'),
    path('admin/<uuid:pk>/', AdminOrderDetailView.as_view(), name='admin-order-detail'),
]
