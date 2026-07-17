from django.urls import path
from .views import CreatePaymentOrderView, VerifyPaymentView, WebhookView

urlpatterns = [
    path('create-order/', CreatePaymentOrderView.as_view(), name='payment-create-order'),
    path('verify/', VerifyPaymentView.as_view(), name='payment-verify'),
    path('webhook/', WebhookView.as_view(), name='payment-webhook'),
]
