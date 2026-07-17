"""
FAAZO – Standardised API Response Helpers

All API views must use these helpers to maintain
a consistent response envelope across the application.
"""

from rest_framework import status
from rest_framework.response import Response


def success_response(
    data=None, message: str = "Success", status_code: int = status.HTTP_200_OK, meta: dict = None
):
    """
    Standard success response.

    Shape:
    {
        "success": true,
        "data": <payload>,
        "message": "...",
        "meta": null | { ... }
    }
    """
    return Response(
        {
            "success": True,
            "data": data,
            "message": message,
            "meta": meta,
        },
        status=status_code,
    )


def error_response(
    message: str = "An error occurred.",
    code: str = "ERROR",
    details=None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
):
    """
    Standard error response.

    Shape:
    {
        "success": false,
        "data": null,
        "error": {
            "code": "...",
            "message": "...",
            "details": null | [ ... ]
        }
    }
    """
    return Response(
        {
            "success": False,
            "data": None,
            "error": {
                "code": code,
                "message": message,
                "details": details,
            },
        },
        status=status_code,
    )
