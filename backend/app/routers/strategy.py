from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import StrategyInput, StrategyResponse, HistoryResponse
from app.core.security import get_current_user
from app.core.mongo import db
from app.core.config import settings
from app.services.strategy_service import strategy_service
from datetime import datetime, timedelta, timezone
import hashlib
import json
import time
import asyncio

router = APIRouter(prefix="/api", tags=["Strategy"])

# ============================================================================
# FREE-TIER MONTHLY LIMIT (source of truth: User document in MongoDB)
# ============================================================================

FREE_MONTHLY_LIMIT = 3

def check_monthly_limit(user_id: str, tier: str = "free") -> dict:
    """
    Check if free-tier user has exceeded monthly strategy generation limit.
    Uses usage_count/usage_month from User document (NOT strategy count).
    Pro/Expert users bypass this limit.
    """
    if tier in ("pro", "expert"):
        return {"exceeded": False, "used": 0, "limit": None}
    
    from app.core.mongo import users_collection
    from bson import ObjectId
    
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        return {"exceeded": True, "message": "User not found"}
    
    usage_month = user.get("usage_month", "")
    usage_count = user.get("usage_count", 0)
    
    # Monthly reset: if month changed, reset count
    if usage_month != current_month:
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"usage_count": 0, "usage_month": current_month}}
        )
        usage_count = 0
    
    if usage_count >= FREE_MONTHLY_LIMIT:
        return {
            "exceeded": True,
            "message": f"Free tier limit ({FREE_MONTHLY_LIMIT} strategies/month) reached. Upgrade to Pro for unlimited access.",
            "used": usage_count,
            "limit": FREE_MONTHLY_LIMIT
        }
    
    return {
        "exceeded": False,
        "used": usage_count,
        "limit": FREE_MONTHLY_LIMIT
    }

# ============================================================================
# BURST RATE LIMITING (anti-abuse: 10 requests per 5-hour window)
# ============================================================================

FREE_LIMIT = 10
WINDOW_HOURS = 5

def check_rate_limit(user_id: str, tier: str = "free") -> dict:
    """Check if user has exceeded burst rate limit based on tier"""
    # Define limits based on tier
    if tier == "pro":
        limit = 50
    elif tier == "expert":
        limit = 100
    else:
        limit = FREE_LIMIT

    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=WINDOW_HOURS)
    
    used = db.rate_limits.count_documents({
        "user_id": user_id,
        "timestamp": {"$gte": window_start}
    })
    
    if used >= limit:
        reset_time = window_start + timedelta(hours=WINDOW_HOURS)
        if reset_time < now:
             reset_time = now + timedelta(minutes=1)
             
        diff = (reset_time - now).total_seconds()
        reset_h = int(diff // 3600)
        reset_m = int((diff % 3600) // 60)
        
        return {
            "exceeded": True,
            "message": f"{tier.capitalize()} tier burst limit ({limit}) reached. Resets in {reset_h}h {reset_m}m",
            "reset_at": reset_time.timestamp(),
            "used": used,
            "limit": limit
        }
    
    # Record usage (counting attempts)
    db.rate_limits.insert_one({
        "user_id": user_id,
        "timestamp": now
    })
    
    return {
        "exceeded": False,
        "used": used + 1,
        "limit": limit
    }

# ============================================================================
# CACHING UTILITIES
# ============================================================================

def generate_cache_key(strategy_input: StrategyInput) -> str:
    version = "v2"
    input_str = f"{version}|{strategy_input.goal}|{strategy_input.audience}|{strategy_input.industry}|{strategy_input.platform}|{strategy_input.contentType}|{strategy_input.experience}"
    return hashlib.md5(input_str.encode()).hexdigest()

def get_cached_strategy(cache_key: str):
    if not redis_client.enabled:
        return None
    try:
        cached = redis_client.get(f"strategy:{cache_key}")
        return json.loads(cached) if cached else None
    except:
        return None

def set_cached_strategy(cache_key: str, strategy: dict, ttl: int = 86400):
    if not redis_client.enabled:
        return
    try:
        redis_client.setex(f"strategy:{cache_key}", ttl, json.dumps(strategy))
    except:
        pass


@router.post("/strategy")
async def generate_strategy(
    strategy_input: StrategyInput,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    tier = current_user.get("tier", "free")
    
    # 1. Monthly Limit Check (free-tier: 3/month, source of truth: User doc)
    monthly_info = check_monthly_limit(user_id, tier)
    if monthly_info["exceeded"]:
        raise HTTPException(status_code=429, detail=monthly_info)
    
    # 2. Burst Rate Limiting (anti-abuse: 10/5hr window)
    rate_info = check_rate_limit(user_id, tier)
    if rate_info["exceeded"]:
        raise HTTPException(status_code=429, detail=rate_info)
    
    try:
        # Delegate to Service
        result = await strategy_service.create_strategy(user_id, strategy_input)
        
        # Inject usage info into response for frontend convenience
        result["usage"] = monthly_info  # Monthly limit info (source of truth)
        result["rate_limit"] = rate_info  # Burst rate limit info
        result["tier"] = tier

        # Broadcast live event to admin dashboard
        try:
            from app.websocket.activity_socket import broadcast_event
            asyncio.create_task(broadcast_event("strategy_generated", {
                "details": f"Strategy for: {(strategy_input.goal or '')[:40]}",
                "user_id": user_id,
                "industry": strategy_input.industry or "",
            }))
        except Exception:
            pass
        
        return result
        
    except Exception as e:
        print(f"❌ Strategy Generation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    strategies = await strategy_service.get_user_history(current_user["id"])
    return {
        "history": strategies,
        "count": len(strategies)
    }

# NEW: Get specific strategy
@router.get("/history/{strategy_id}")
async def get_strategy_by_id(strategy_id: str, current_user: dict = Depends(get_current_user)):
    strategy_doc = await strategy_service.get_strategy_by_id(strategy_id, current_user["id"])
    if not strategy_doc:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strategy_doc

# ============================================================================
# NEW: Delete specific strategy (SOFT DELETE)
# ============================================================================
@router.delete("/history/{strategy_id}")
async def delete_strategy(strategy_id: str, current_user: dict = Depends(get_current_user)):
    result = await strategy_service.delete_strategy(strategy_id, current_user["id"])
    if not result["success"]:
        raise HTTPException(status_code=result.get("code", 500), detail=result["message"])
    # Broadcast live event to admin dashboard
    try:
        from app.websocket.activity_socket import broadcast_event
        asyncio.create_task(broadcast_event("strategy_deleted", {
            "details": f"Strategy {strategy_id} deleted",
            "user_id": current_user["id"],
        }))
    except Exception:
        pass
    return result


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    stats = await strategy_service.get_user_usage_stats(current_user["id"])
    
    return {
        "email": current_user.get("email"),
        "tier": current_user.get("tier", "free"),
        "usage_count": stats["usage_count"],
        "total_strategies": stats["total_strategies"],
        "created_at": current_user.get("created_at"),
        "razorpay_subscription_id": current_user.get("razorpay_subscription_id")
    }
