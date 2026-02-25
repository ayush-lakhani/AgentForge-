from datetime import datetime, timezone
from fastapi import HTTPException, status
from bson import ObjectId
from typing import Optional

from app.core.mongo import users_collection
from app.core.security import get_password_hash, verify_password, create_access_token

class AuthService:
    async def signup(self, user_data) -> dict:
        """
        Handles user registration logic.
        """
        if users_collection.find_one({"email": user_data.email}):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        current_month = datetime.now(timezone.utc).strftime("%Y-%m")
        user_doc = {
            "email": user_data.email,
            "hashed_password": get_password_hash(user_data.password),
            "role": "client",  # Default role
            "tier": "free",
            "usage_count": 0,
            "usage_month": current_month,
            "created_at": datetime.now(timezone.utc)
        }
        
        result = users_collection.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Token creation with role claim
        access_token = create_access_token(data={"sub": user_id, "role": "client"})
        
        return {
            "access_token": access_token,
            "user_id": user_id,
            "email": user_data.email,
            "role": "client"
        }

    async def login(self, user_data) -> dict:
        """
        Handles user login and JWT issuance.
        """
        user = users_collection.find_one({"email": user_data.email})
        if not user or not verify_password(user_data.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user_id = str(user["_id"])
        user_role = user.get("role", "client")
        
        # Token creation with role claim
        access_token = create_access_token(data={"sub": user_id, "role": user_role})
        
        return {
            "access_token": access_token,
            "user_id": user_id,
            "email": user_data.email,
            "role": user_role
        }

auth_service = AuthService()
