"""
FAAZO – Common App Views

Exposes:
- HealthCheckView  → GET /api/v1/health/
- APIRootView      → GET /api/v1/

No authentication required on health check (used by load balancers / Docker).
"""

import logging

from django.conf import settings
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger("faazo.common")


@method_decorator(csrf_exempt, name="dispatch")
class HealthCheckView(View):
    """
    GET /api/v1/health/

    Returns server health status.
    No authentication required.
    Used by Docker HEALTHCHECK, Kubernetes probes, and load balancers.
    """

    def get(self, request):
        logger.debug("Health check requested from %s", request.META.get("REMOTE_ADDR"))
        return JsonResponse(
            {
                "success": True,
                "data": {
                    "status": "healthy",
                    "service": getattr(settings, "APP_NAME", "FAAZO Dental Solutions API"),
                    "version": getattr(settings, "APP_VERSION", "1.0.0"),
                    "environment": "development" if settings.DEBUG else "production",
                },
                "message": "Server is running.",
                "meta": None,
            },
            status=200,
        )
