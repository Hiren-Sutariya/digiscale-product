import os
import rembg
from PIL import Image
import pillow_heif
from app.config import settings

# Register HEIC/HEIF file support with Pillow
pillow_heif.register_heif_opener()

_rembg_session = None

def get_session():
    global _rembg_session
    if _rembg_session is None:
        # Load the model name dynamically (defaults to normal 'u2net' locally)
        model_name = os.getenv("BGD_MODEL_NAME", "u2net")
        print(f"Loading background removal model: {model_name}")
        _rembg_session = rembg.new_session(model_name)
    return _rembg_session

def remove_background(input_path: str, output_path: str) -> bool:
    try:
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Load image
        input_image = Image.open(input_path)
        
        # Optimize resolution for fast background removal processing on CPU
        max_size = 1600
        if max(input_image.size) > max_size:
            input_image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        # Remove background using rembg with the selected session
        session = get_session()
        output_image = rembg.remove(input_image, session=session)
        
        # Convert to RGB if we want a white background instead of transparent
        # We will save as WEBP to drastically reduce file sizes while keeping transparency
        output_image.save(output_path, "WEBP", lossless=False, quality=85)
        return True
    except Exception as e:
        print(f"Error removing background: {e}")
        return False

def add_white_background(input_path: str, output_path: str) -> bool:
    try:
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Open transparent image
        img = Image.open(input_path)
        
        # If it has alpha channel, paste onto a white background
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else img.convert('RGBA').split()[3])
            background.save(output_path, "WEBP", quality=85)
        else:
            img.save(output_path, "WEBP", quality=85)
        return True
    except Exception as e:
        print(f"Error adding white background: {e}")
        return False
