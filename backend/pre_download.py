import os
import sys

# Define target .u2net directory relative to this script
backend_dir = os.path.dirname(os.path.abspath(__file__))
u2net_home = os.path.join(backend_dir, ".u2net")

# Set environment variable for rembg
os.environ["U2NET_HOME"] = u2net_home

print(f"Pre-downloading u2net model to: {u2net_home}")

try:
    import rembg
    # This will download the u2net model file and save it to backend_dir/.u2net/u2net.onnx
    rembg.new_session("u2net")
    print("u2net model pre-downloaded successfully!")
except Exception as e:
    print(f"Error during pre-download: {e}")
    sys.exit(1)
