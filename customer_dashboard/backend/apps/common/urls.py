"""
FAAZO – Common App URL Patterns

Registers the health check endpoint.
All future module URLs are registered in config/urls.py.
"""

from django.urls import path

from .views import HealthCheckView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
]
