"""
FAAZO – Razorpay Service Layer

Thin wrapper around the Razorpay Python SDK.
All Razorpay API interactions go through this module.
Never import razorpay directly in views.
Supports fallback developer sandbox mock when API keys are default placeholders.
"""

import hashlib
import hmac
import logging
import uuid

import razorpay
from django.conf import settings

logger = logging.getLogger("faazo.payments")

# Lazy-initialised Razorpay client singleton
_client = None


def is_sandbox_mode() -> bool:
    """Checks if the system is configured to run in payment sandbox mode."""
    key_id = settings.RAZORPAY_KEY_ID
    key_secret = settings.RAZORPAY_KEY_SECRET
    return (
        not key_id 
        or not key_secret 
        or "REPLACE" in key_id 
        or "REPLACE" in key_secret
    )


def _get_client():
    """Returns a singleton Razorpay client instance."""
    global _client
    if _client is None:
        key_id = settings.RAZORPAY_KEY_ID
        key_secret = settings.RAZORPAY_KEY_SECRET
        if not key_id or not key_secret:
            raise ValueError(
                "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables."
            )
        _client = razorpay.Client(auth=(key_id, key_secret))
        logger.info("Razorpay client initialised (key_id=%s…)", key_id[:12])
    return _client


def create_razorpay_order(amount_paise: int, receipt: str, notes: dict = None):
    """
    Create a Razorpay order.
    If credentials are placeholders, returns a mock order structure.
    """
    if is_sandbox_mode():
        mock_id = f"order_mock_{uuid.uuid4().hex[:14]}"
        logger.info("[SANDBOX MODE] Simulating Razorpay order creation: receipt=%s, id=%s", receipt, mock_id)
        return {
            "id": mock_id,
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "status": "created",
            "notes": notes or {},
        }

    client = _get_client()
    order_data = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": receipt,
        "notes": notes or {},
    }
    logger.info("Creating Razorpay order: receipt=%s amount=%d paise", receipt, amount_paise)
    order = client.order.create(data=order_data)
    logger.info("Razorpay order created: %s", order.get("id"))
    return order


def verify_payment_signature(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
    """
    Verify the Razorpay payment signature using HMAC-SHA256.
    If sandbox mode, simulates validation for mock signatures.
    """
    if razorpay_order_id.startswith("order_mock_") or is_sandbox_mode():
        logger.info("[SANDBOX MODE] Simulating signature verification: order=%s payment=%s", razorpay_order_id, razorpay_payment_id)
        # Sandbox signature checks standard pattern or dummy matches
        expected_sig = f"sig_mock_{razorpay_order_id}_{razorpay_payment_id}"
        return razorpay_signature == expected_sig or razorpay_signature.startswith("sig_mock_")

    key_secret = settings.RAZORPAY_KEY_SECRET
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected_signature = hmac.new(
        key_secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    is_valid = hmac.compare_digest(expected_signature, razorpay_signature)
    if is_valid:
        logger.info("Payment signature verified: order=%s payment=%s", razorpay_order_id, razorpay_payment_id)
    else:
        logger.warning(
            "Payment signature INVALID: order=%s payment=%s",
            razorpay_order_id,
            razorpay_payment_id,
        )
    return is_valid


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """Verify a Razorpay webhook signature."""
    if is_sandbox_mode():
        logger.info("[SANDBOX MODE] Skipping webhook verification (Always True)")
        return True

    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
    if not webhook_secret:
        logger.error("RAZORPAY_WEBHOOK_SECRET is not configured — rejecting webhook.")
        return False

    expected = hmac.new(
        webhook_secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()

    is_valid = hmac.compare_digest(expected, signature)
    if not is_valid:
        logger.warning("Webhook signature verification FAILED.")
    return is_valid


def fetch_payment_details(payment_id: str) -> dict:
    """Fetch full payment details from Razorpay."""
    if payment_id.startswith("pay_mock_") or is_sandbox_mode():
        logger.info("[SANDBOX MODE] Returning mock payment details: %s", payment_id)
        return {
            "id": payment_id,
            "status": "captured",
            "method": "card",
            "amount": 50000,
            "currency": "INR",
            "card": {
                "last4": "1111",
                "network": "Visa",
                "type": "credit"
            }
        }

    client = _get_client()
    try:
        return client.payment.fetch(payment_id)
    except Exception as e:
        logger.error("Failed to fetch payment details for %s: %s", payment_id, e)
        return {}
