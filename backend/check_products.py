import os
import requests
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}
response = requests.get(f"{url}/rest/v1/products?select=id,name,user_id,collection_id", headers=headers)
print(response.json())
