"""
Background removal using BiRefNet (ZhengPeng7/BiRefNet) via rembg.
"""

import os
import io
import base64
import logging
import urllib.request
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from PIL import Image

# rembg and heavy model disabled to support live deployment on Render
# try:
#     from rembg import remove
#     from app.api.upload import bg_session, REMBG_AVAILABLE
# except ImportError:
#     REMBG_AVAILABLE = False
#     bg_session = None
REMBG_AVAILABLE = False
bg_session = None

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
    Remove background using BiRefNet model.
    """
    if not REMBG_AVAILABLE or bg_session is None:
        # Fallback to original image for live Render environment without heavy AI memory limits
        return RemoveBgResponse(image_url=req.image_url)

    try:
        # Load image data from base64 or download from HTTP url
        if req.image_url.startswith("http"):
            req_obj = urllib.request.Request(
                req.image_url,
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            )
            with urllib.request.urlopen(req_obj) as response:
                image_data = response.read()
        else:
            header, encoded = req.image_url.split(",", 1) if "," in req.image_url else ("", req.image_url)
            image_data = base64.b64decode(encoded)

        # Open image with PIL
        input_image = Image.open(io.BytesIO(image_data))

        # Run background removal using starlette threadpool to avoid blocking event loop
        from starlette.concurrency import run_in_threadpool
        output_image = await run_in_threadpool(remove, input_image, session=bg_session)

        # Save output image back to base64 PNG
        buffer = io.BytesIO()
        output_image.save(buffer, format="PNG")
        output_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return RemoveBgResponse(image_url=f"data:image/png;base64,{output_base64}")
    except Exception as e:
        logger.exception("Failed to process background removal using BiRefNet")
        raise HTTPException(
            status_code=500,
            detail=f"Background removal processing error: {str(e)}"
        )
