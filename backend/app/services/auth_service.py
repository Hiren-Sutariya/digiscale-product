import hashlib
import hmac
import json
import base64
import time
from typing import Optional, Dict
from app.config import settings

def hash_password(password: str) -> str:
    # Use SHA-256 with a static salt for local simplicity
    salt = "digiscale_salt_key_12345!"
    pw_bytes = (password + salt).encode('utf-8')
    return hashlib.sha256(pw_bytes).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

# Standard JWT generation using built-in Python libraries to avoid PyJWT/jose dependencies
def base64url_encode(payload: bytes) -> str:
    return base64.urlsafe_b64encode(payload).rstrip(b'=').decode('utf-8')

def base64url_decode(payload: str) -> bytes:
    padding = '=' * (4 - (len(payload) % 4))
    return base64.urlsafe_b64decode(payload + padding)

def create_access_token(data: Dict, expires_delta: Optional[float] = None) -> str:
    header = {"alg": settings.ALGORITHM, "typ": "JWT"}
    
    payload = data.copy()
    if expires_delta:
        expire = time.time() + expires_delta
    else:
        expire = time.time() + (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    payload.update({"exp": int(expire)})
    
    # Encode header and payload
    header_json = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_json = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    
    segments = [
        base64url_encode(header_json),
        base64url_encode(payload_json)
    ]
    
    # Calculate signature
    signing_input = ".".join(segments).encode('utf-8')
    key = settings.JWT_SECRET.encode('utf-8')
    signature = hmac.new(key, signing_input, hashlib.sha256).digest()
    
    segments.append(base64url_encode(signature))
    return ".".join(segments)

def decode_access_token(token: str) -> Optional[Dict]:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
            
        header_segment, payload_segment, crypto_segment = parts
        
        # Verify signature
        signing_input = f"{header_segment}.{payload_segment}".encode('utf-8')
        key = settings.JWT_SECRET.encode('utf-8')
        expected_signature = hmac.new(key, signing_input, hashlib.sha256).digest()
        
        actual_signature = base64url_decode(crypto_segment)
        
        if not hmac.compare_digest(expected_signature, actual_signature):
            return None
            
        # Parse payload
        payload_json = base64url_decode(payload_segment)
        payload = json.loads(payload_json.decode('utf-8'))
        
        # Check expiration
        if "exp" in payload and payload["exp"] < time.time():
            return None
            
        return payload
    except Exception:
        return None
