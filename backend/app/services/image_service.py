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
        
        # Self-healing logic for corrupted model downloads
        u2net_home = os.environ.get("U2NET_HOME", "")
        model_path = os.path.join(u2net_home, "u2netp.onnx")
        
        if os.path.exists(model_path):
            file_size = os.path.getsize(model_path)
            # A valid u2netp.onnx is ~4.57MB (4.5 million bytes).
            # If it is less than 4MB, it's corrupted or incomplete.
            if file_size < 4000000:
                print(f"Warning: Corrupted model file detected (size: {file_size} bytes). Deleting it for redownload...")
                try:
                    os.remove(model_path)
                except Exception as del_err:
                    print(f"Error removing corrupted model: {del_err}")
        
        import onnxruntime as ort
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 1
        opts.inter_op_num_threads = 1
        
        try:
            _rembg_session = rembg.new_session("u2netp", opts, providers=['CPUExecutionProvider'])
        except Exception as e:
            print(f"Failed to load rembg session with CPU provider: {e}. Retrying after deleting model cache...")
            if os.path.exists(model_path):
                try:
                    os.remove(model_path)
                except Exception as del_err:
                    print(f"Error removing model: {del_err}")
            # Try to load again (will redownload the model)
            _rembg_session = rembg.new_session("u2netp", opts, providers=['CPUExecutionProvider'])
            
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
