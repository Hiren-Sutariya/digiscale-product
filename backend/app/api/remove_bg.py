"""
Background removal using BiRefNet (ZhengPeng7/BiRefNet) via rembg.
Disabled on server deployment to avoid downloading heavy models on Render.
"""

import os
import io
import base64
import asyncio
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["background-remove"])

# Request / Response models
class RemoveBgRequest(BaseModel):
    image_url: str  # base64 data URL  OR  https:// URL


class RemoveBgResponse(BaseModel):
    image_url: str  # base64 PNG with transparent background


# Endpoint
@router.post("/remove-bg", response_model=RemoveBgResponse)
async def remove_background(req: RemoveBgRequest):
    """
    Remove background endpoint (Disabled for server deployment).
    """
    raise HTTPException(
        status_code=501,
        detail="Background removal (BiRefNet/rembg) is disabled on this server deployment."
    )

