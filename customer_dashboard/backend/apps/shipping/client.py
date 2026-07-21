"""
FAAZO – Delhivery API Client

Handles raw HTTP communication with Delhivery Express APIs (Sandbox & Live).

Responsibilities:
  - Authentication (Token Header)
  - Endpoint execution (Create Shipment, Track, Cancel, Schedule Pickup)
  - Transient Retry Logic (3 retries with exponential backoff for 5xx / Timeouts)
  - Response Parsing & Error Classification
  - Sensitive Data Masking in Logs

This client does NOT handle DB models or business workflows — those belong in providers.py.
"""

import time
import logging
import requests
from django.conf import settings

logger = logging.getLogger("faazo")


class DelhiveryAPIError(Exception):
    """Raised when Delhivery API returns an unrecoverable error or unexpected response."""
    def __init__(self, message: str, status_code: int = None, details: dict = None):
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class DelhiveryValidationError(Exception):
    """
    Raised when payload fails pre-flight validation or Delhivery returns 400/422 validation errors.
    Carries structured list of errors for DRF views.
    """
    def __init__(self, errors: list):
        self.errors = errors
        super().__init__(" | ".join(errors))


class DelhiveryAPIClient:
    """
    HTTP Client for Delhivery API interactions.
    Implements transient retries (max 3 retries, exponential backoff) for 5xx & Timeout errors.
    Does NOT retry 400, 401, 403, 404, 422 errors.
    """

    def __init__(self, base_url: str, token: str, client_name: str = "FAAZO"):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.client_name = client_name
        self.max_retries = 3
        self.initial_backoff_sec = 1.0

    @property
    def headers(self) -> dict:
        return {
            "Authorization": f"Token {self.token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _mask_payload(self, data: dict) -> dict:
        """Sanitizes sensitive information for audit logging."""
        if not data or not isinstance(data, dict):
            return data
        sanitized = data.copy()
        if "Authorization" in sanitized:
            sanitized["Authorization"] = "Token ***MASKED***"
        return sanitized

    def _execute_request(self, method: str, path: str, json_data: dict = None, params: dict = None, timeout: int = 30) -> tuple[dict, int, float]:
        """
        Executes HTTP request with exponential backoff for transient failures (5xx, Timeouts).
        Returns tuple: (response_data, http_status_code, execution_time_ms).
        """
        url = f"{self.base_url}{path}"
        attempt = 0

        while attempt < self.max_retries:
            attempt += 1
            req_start = time.time()
            try:
                logger.info(
                    "[DELHIVERY_HTTP] %s %s (Attempt %d/%d)",
                    method.upper(), url, attempt, self.max_retries
                )

                if method.upper() == "POST":
                    resp = requests.post(url, json=json_data, headers=self.headers, timeout=timeout)
                elif method.upper() == "GET":
                    resp = requests.get(url, params=params, headers=self.headers, timeout=timeout)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")

                exec_time_ms = round((time.time() - req_start) * 1000, 2)
                status_code = resp.status_code

                # Parse JSON if possible
                try:
                    res_data = resp.json()
                except Exception:
                    res_data = {"raw": resp.text}

                # Success 2xx
                if 200 <= status_code < 300:
                    logger.info(
                        "[DELHIVERY_HTTP_SUCCESS] %s %s → Status %d (%.2fms)",
                        method.upper(), path, status_code, exec_time_ms
                    )
                    return res_data, status_code, exec_time_ms

                # Transient Server Errors (5xx) -> Retry with Backoff
                if status_code >= 500:
                    logger.warning(
                        "[DELHIVERY_HTTP_5XX] %s %s returned status %d. Attempt %d/%d.",
                        method.upper(), path, status_code, attempt, self.max_retries
                    )
                    if attempt < self.max_retries:
                        backoff = self.initial_backoff_sec * (2 ** (attempt - 1))
                        time.sleep(backoff)
                        continue

                # Client Errors (4xx) -> DO NOT RETRY
                error_msg = res_data.get("rmk") or res_data.get("message") or res_data.get("error") or resp.text
                if status_code in [401, 403]:
                    logger.error("[DELHIVERY_AUTH_ERROR] Status %d on %s: %s", status_code, path, error_msg)
                    raise DelhiveryAPIError(f"Delhivery Authentication Failed ({status_code}): {error_msg}", status_code=status_code, details=res_data)
                elif status_code in [400, 422]:
                    logger.error("[DELHIVERY_VALIDATION_ERROR] Status %d on %s: %s", status_code, path, error_msg)
                    raise DelhiveryValidationError([f"Delhivery Validation Error ({status_code}): {error_msg}"])
                else:
                    raise DelhiveryAPIError(f"Delhivery Error ({status_code}): {error_msg}", status_code=status_code, details=res_data)

            except (requests.Timeout, requests.ConnectionError) as conn_err:
                exec_time_ms = round((time.time() - req_start) * 1000, 2)
                logger.warning(
                    "[DELHIVERY_CONN_TIMEOUT] %s %s connection failure: %s. Attempt %d/%d.",
                    method.upper(), path, str(conn_err), attempt, self.max_retries
                )
                if attempt < self.max_retries:
                    backoff = self.initial_backoff_sec * (2 ** (attempt - 1))
                    time.sleep(backoff)
                    continue
                raise DelhiveryAPIError(f"Delhivery API Connection/Timeout Error: {str(conn_err)}", status_code=504)

        raise DelhiveryAPIError(f"Delhivery API failed after {self.max_retries} attempts.")

    # ─────────────────────────────────────────────────────────────
    # API Methods
    # ─────────────────────────────────────────────────────────────

    def create_shipment_api(self, payload: dict) -> tuple[dict, int, float]:
        return self._execute_request("POST", "/api/cmu/create.json", json_data=payload)

    def track_shipment_api(self, waybill: str) -> tuple[dict, int, float]:
        return self._execute_request("GET", "/api/v1/packages/json/", params={"waybill": waybill})

    def cancel_shipment_api(self, waybill: str) -> tuple[dict, int, float]:
        payload = {"waybill": waybill, "cancellation": "true"}
        return self._execute_request("POST", "/api/p/edit", json_data=payload)

    def schedule_pickup_api(self, pickup_payload: dict) -> tuple[dict, int, float]:
        return self._execute_request("POST", "/fm/request/new/", json_data=pickup_payload)
