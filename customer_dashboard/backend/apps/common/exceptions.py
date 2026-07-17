"""
FAAZO – Custom Exception Handler

Wraps all DRF exceptions into the standard FAAZO error envelope
so every error response is consistent regardless of its source.
"""

import logging

from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Override DRF's default exception handler to enforce the standard envelope:

    {
        "success": false,
        "data": null,
        "error": {
            "code": "...",
            "message": "...",
            "details": null | [ { "field": "...", "issue": "..." } ]
        }
    }
    """
    # Call DRF's default handler first to get the standard response
    response = exception_handler(exc, context)

    if response is not None:
        original_data = response.data
        code = _get_error_code(response.status_code)
        message = _extract_message(original_data)
        details = _extract_details(original_data)
        
        # Log validation/API error details for debugging
        logger.warning("API error occurred: code=%s, message=%s, details=%s", code, message, details)

        response.data = {
            "success": False,
            "data": None,
            "error": {
                "code": code,
                "message": message,
                "details": details,
            },
        }
    else:
        # Unhandled exceptions – log them, return 500
        logger.exception("Unhandled exception: %s", exc)

    return response


# ============================================================
# Private Helpers
# ============================================================


def _get_error_code(status_code: int) -> str:
    mapping = {
        400: "VALIDATION_FAILED",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        429: "RATE_LIMIT_EXCEEDED",
        500: "SERVER_ERROR",
    }
    return mapping.get(status_code, "ERROR")


def _extract_message(data) -> str:
    if isinstance(data, dict):
        if "detail" in data:
            return str(data["detail"])
        # Return the first field error as the primary message
        for key, value in data.items():
            if isinstance(value, list) and value:
                return str(value[0])
            if isinstance(value, str):
                return value
    if isinstance(data, list) and data:
        return str(data[0])
    return "An error occurred."


def _extract_details(data) -> list | None:
    if isinstance(data, dict) and "detail" not in data:
        details = []
        for field, errors in data.items():
            if isinstance(errors, list):
                for error in errors:
                    details.append({"field": field, "issue": str(error)})
            else:
                details.append({"field": field, "issue": str(errors)})
        return details if details else None
    return None
