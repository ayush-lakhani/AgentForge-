from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import UserCreate, UserLogin, Token
from app.services.auth_service import auth_service
import asyncio

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=Token)
async def signup(user_data: UserCreate):
    """
    Router handles HTTP level details. Business logic is in AuthService.
    """
    result = await auth_service.signup(user_data)
    
    # Broadcast live event to admin dashboard (Asynchronous)
    try:
        from app.websocket.activity_socket import broadcast_event
        asyncio.create_task(broadcast_event("user_signup", {
            "details": f"New user registered: {user_data.email}",
            "email": user_data.email,
            "user_id": result["user_id"],
        }))
    except Exception:
        pass

    return result

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    """
    Router handles HTTP level details. Business logic is in AuthService.
    """
    return await auth_service.login(user_data)
