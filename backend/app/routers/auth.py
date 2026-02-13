from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from app.models.schemas import UserCreate, UserLogin, Token, UserResponse
from app.core.database import users_collection
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=Token)
async def signup(user_data: UserCreate):
    print(f"📝 [AUTH] New Signup Attempt: {user_data.email}")
    if users_collection.find_one({"email": user_data.email}):
        print(f"❌ [AUTH] Signup Failed: Email already registered ({user_data.email})")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": user_data.email,
        "hashed_password": get_password_hash(user_data.password),
        "tier": "free",
        "created_at": datetime.now(timezone.utc)
    }
    
    result = users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    print(f"✅ [AUTH] Signup Successful: {user_data.email} (ID: {user_id})")
    access_token = create_access_token(data={"sub": user_id})
    return Token(access_token=access_token, user_id=user_id, email=user_data.email)

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    print(f"🔑 [AUTH] Login Attempt: {user_data.email}")
    user = users_collection.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        print(f"❌ [AUTH] Login Failed: Invalid credentials ({user_data.email})")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    print(f"✅ [AUTH] Login Successful: {user_data.email}")
    access_token = create_access_token(data={"sub": user_id})
    return Token(access_token=access_token, user_id=user_id, email=user_data.email)
