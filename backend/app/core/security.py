from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from bson import ObjectId
import secrets
import hashlib

from app.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash password using Argon2"""
    return pwd_context.hash(password)

get_password_hash = hash_password

def verify_password(password: str, hashed: str) -> bool:
    """Verify password - supports Argon2 and legacy SHA256"""
    # Legacy SHA256 verification
    def verify_password_sha256(password: str, hashed: str) -> bool:
        try:
            salt, pwd_hash = hashed.split('$')
            return hashlib.sha256((password + salt).encode()).hexdigest() == pwd_hash
        except:
            return False

    # Let passlib handle identification (Argon2, etc)
    try:
        return pwd_context.verify(password, hashed)
    except:
        # Fallback to legacy check if passlib fails (e.g. unknown hash format)
        return verify_password_sha256(password, hashed)

def create_access_token(data: dict, expires_hours: int = None) -> str:
    """
    Creates a signed JWT.
    Standard claims:
    - sub: user_id
    - role: user role (admin, client, etc)
    - exp: expiry time
    """
    to_encode = data.copy()
    hours = expires_hours if expires_hours is not None else settings.ACCESS_TOKEN_EXPIRE_HOURS
    expire = datetime.now(timezone.utc) + timedelta(hours=hours)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
