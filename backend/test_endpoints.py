import requests

# 1. Login to get token
# (I need the user's credentials, but I don't know them. Is there a test user?)
# Or I can just hit the endpoint without token and see if it returns 401 or 500!
r = requests.get("http://localhost:8000/users/me")
print("users/me:", r.status_code, r.text)
r = requests.get("http://localhost:8000/settings/")
print("settings/:", r.status_code, r.text)
