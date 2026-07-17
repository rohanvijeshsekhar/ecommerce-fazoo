from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ComboDealViewSet, ComboDealBannerSettingView

router = DefaultRouter()
router.register(r"", ComboDealViewSet, basename="combo")

urlpatterns = [
    path("banner/", ComboDealBannerSettingView.as_view(), name="combo-banner"),
] + router.urls

