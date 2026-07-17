from django.urls import path
from .views import CheckoutPreviewView, CheckoutPlaceView

urlpatterns = [
    path('preview/', CheckoutPreviewView.as_view(), name='checkout-preview'),
    path('place/', CheckoutPlaceView.as_view(), name='checkout-place'),
]
