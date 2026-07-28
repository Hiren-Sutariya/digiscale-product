import requests
import sqlite3

# Get a valid token
conn = sqlite3.connect("app.db")
c = conn.cursor()
c.execute("SELECT email FROM users LIMIT 1")
row = c.fetchone()
if not row:
    print("No users found")
    exit(1)
email = row[0]

import time
import jwt
import os
from dotenv import load_dotenv

load_dotenv()
secret = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
token = jwt.encode({"sub": email, "exp": time.time() + 3600}, secret, algorithm="HS256")

print("Fetching /settings/")
r = requests.get("http://localhost:8000/settings/", headers={"Authorization": f"Bearer {token}"})
print(r.status_code)
print(r.text)
