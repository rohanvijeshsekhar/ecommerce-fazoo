"""
FAAZO – Custom Middleware

RequestLoggingMiddleware
    Logs every incoming request with method, path, status code,
    duration, and client IP. Excludes health check endpoint
    and static file requests to keep logs clean.

SecurityHeadersMiddleware
    Adds extra security response headers not covered by Django's
    SecurityMiddleware. Used in development where HTTPS is off.
"""

import logging
import time

logger = logging.getLogger("faazo.requests")
security_logger = logging.getLogger("faazo.security")


class RequestLoggingMiddleware:
    """
    Log all HTTP requests with timing and IP information.

    Excluded paths (to avoid log noise):
    - /api/v1/health/
    - /static/
    - /media/
    - /__debug__/ (debug toolbar)

    Log format:
        [METHOD] /path/ → STATUS_CODE  (Xms)  ip=X.X.X.X
    """

    EXCLUDED_PREFIXES = ("/static/", "/media/", "/__debug__/", "/favicon.ico")
    EXCLUDED_EXACT = {"/api/v1/health/"}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # Skip logging for noise paths
        if path in self.EXCLUDED_EXACT or any(path.startswith(p) for p in self.EXCLUDED_PREFIXES):
            return self.get_response(request)

        # Start timer
        start_time = time.monotonic()

        # Process the request
        response = self.get_response(request)

        # Calculate duration
        duration_ms = round((time.monotonic() - start_time) * 1000, 2)

        # Safely extract client IP
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        client_ip = (
            x_forwarded_for.split(",")[0].strip()
            if x_forwarded_for
            else request.META.get("REMOTE_ADDR", "?")
        )

        # Determine log level by response status
        status_code = response.status_code
        if status_code >= 500:
            log = logger.error
        elif status_code >= 400:
            log = logger.warning
        else:
            log = logger.info

        log(
            "[%s] %s → %s  (%sms)  ip=%s",
            request.method,
            path,
            status_code,
            duration_ms,
            client_ip,
        )

        return response


class SecurityHeadersMiddleware:
    """
    Adds security headers to every response.

    Headers added:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY  (overrides Django default if needed)
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy: camera=(), microphone=(), geolocation=()
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response
