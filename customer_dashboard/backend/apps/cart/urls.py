from django.urls import path
from .views import CartView, CartAddView, CartItemDetailView, CartClearView

urlpatterns = [
    path('', CartView.as_view(), name='cart-detail'),
    path('add/', CartAddView.as_view(), name='cart-add'),
    path('items/<uuid:pk>/', CartItemDetailView.as_view(), name='cart-item-detail'),
    path('clear/', CartClearView.as_view(), name='cart-clear'),
]
