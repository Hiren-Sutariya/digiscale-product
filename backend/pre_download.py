import os
import sys

# Define target .u2net directory relative to this script
backend_dir = os.path.dirname(os.path.abspath(__file__))
u2net_home = os.path.join(backend_dir, ".u2net")

# Set environment variable for rembg
os.environ["U2NET_HOME"] = u2net_home

print(f"Pre-downloading u2netp model to: {u2net_home}")

try:
    import rembg
    # This will download the u2netp model file and save it to backend_dir/.u2net/u2netp.onnx
    rembg.new_session("u2netp", providers=['CPUExecutionProvider'])
    print("u2netp model pre-downloaded successfully!")
except Exception as e:
    print(f"Error during pre-download: {e}")
    sys.exit(1)
