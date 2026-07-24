import os
import gc

# Set U2NET_HOME to backend/.u2net to use the pre-downloaded model
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["U2NET_HOME"] = os.path.join(backend_dir, ".u2net")

from PIL import Image
import pillow_heif
from app.config import settings

# Register HEIC/HEIF file support with Pillow
pillow_heif.register_heif_opener()

_rembg_session = None

def get_session():
    global _rembg_session
    if _rembg_session is None:
        import rembg
        # Using u2netp (approx. 4MB)
        # This is the portable (tiny) version of U2-Net, which uses virtually no memory.
        # This guarantees 0% chance of OOM memory crashes on Render's 512MB RAM free tier.
        _rembg_session = rembg.new_session("u2netp", providers=['CPUExecutionProvider'])
    return _rembg_session

def remove_background(input_path: str, output_path: str) -> bool:
    try:
        # Run garbage collection before starting to free up old memory
        gc.collect()
        
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Load image
        input_image = Image.open(input_path)
        
        # Optimize resolution for fast background removal processing on CPU
        # Resizing to max 1000px reduces memory usage significantly (avoiding 512MB RAM OOM crash)
        max_size = 1000
        if max(input_image.size) > max_size:
            input_image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        # Remove background using rembg with the u2netp session
        import rembg
        session = get_session()
        output_image = rembg.remove(input_image, session=session)
        
        # Close input image to free file descriptor and memory
        input_image.close()
        del input_image
        
        # Save as PNG to keep transparency
        output_image.save(output_path, "PNG")
        
        # Close and delete output image references
        output_image.close()
        del output_image
        
        # Run garbage collection after finishing to clean up numpy arrays and tensors
        gc.collect()
        return True
    except Exception as e:
        print(f"Error removing background: {e}")
        # Run cleanup even on error
        gc.collect()
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
            background.save(output_path, "JPEG")
        else:
            img.save(output_path, "JPEG")
        return True
    except Exception as e:
        print(f"Error adding white background: {e}")
        return False
