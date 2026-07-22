import razorpay
import hmac
import hashlib
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/api/payments", tags=["payments"])

# ── Razorpay client ──────────────────────────────────────────────────────────
def get_razorpay_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay keys not configured.")
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


# ── Schemas ──────────────────────────────────────────────────────────────────
class CreateOrderRequest(BaseModel):
    plan: str          # "Pro" or "Business"
    billing: str       # "monthly" or "yearly"


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan: str


# ── Plan price map (in paise = ₹ × 100) ─────────────────────────────────────
PLAN_PRICES = {
    "Pro": {
        "monthly": 29900,    # ₹299/mo
        "yearly":  304800,   # ₹254 * 12 = ₹3048
    },
    "Business": {
        "monthly": 69900,    # ₹699/mo
        "yearly":  687600,   # ₹573 * 12 = ₹6876
    },
}


# ── POST /api/payments/create-order ─────────────────────────────────────────
@router.post("/create-order")
def create_order(body: CreateOrderRequest):
    if body.plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {body.plan}")

    billing = body.billing if body.billing in ("monthly", "yearly") else "monthly"
    amount = PLAN_PRICES[body.plan][billing]

    client = get_razorpay_client()

    try:
        order = client.order.create({
            "amount": amount,
            "currency": "INR",
            "payment_capture": 1,
            "notes": {
                "plan": body.plan,
                "billing": billing,
            }
        })
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay order creation failed: {str(e)}")

    return {
        "order_id": order["id"],
        "amount": amount,
        "currency": "INR",
        "key_id": settings.RAZORPAY_KEY_ID,
        "plan": body.plan,
        "billing": billing,
    }


# ── POST /api/payments/verify ────────────────────────────────────────────────
@router.post("/verify")
def verify_payment(body: VerifyPaymentRequest):
    """
    Verifies the Razorpay payment signature using HMAC SHA256.
    This MUST be done server-side — never trust the client alone.
    """
    msg = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
    expected_signature = hmac.new(
        key=settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        msg=msg.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    if expected_signature != body.razorpay_signature:
        raise HTTPException(status_code=400, detail="Payment verification failed: signature mismatch.")

    # TODO: activate subscription in DB for the authenticated user

    return {
        "success": True,
        "payment_id": body.razorpay_payment_id,
        "plan": body.plan,
        "message": f"{body.plan} plan activated successfully.",
    }
