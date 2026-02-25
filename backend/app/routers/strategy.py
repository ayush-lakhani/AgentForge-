from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import StrategyInput, StrategyResponse, HistoryResponse
from app.dependencies.auth import get_current_user
from app.services.strategy_service import strategy_service
from app.services.usage_service import usage_service
import asyncio

router = APIRouter(prefix="/api", tags=["Strategy"])

@router.post("/strategy")
async def generate_strategy(
    strategy_input: StrategyInput,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    tier = current_user.get("tier", "free")
    
    # 1. Monthly Limit Check via Service
    monthly_info = await usage_service.check_monthly_limit(user_id, tier)
    if monthly_info["exceeded"]:
        raise HTTPException(status_code=429, detail=monthly_info)
    
    # 2. Burst Rate Limiting via Service
    rate_info = await usage_service.check_burst_limit(user_id, tier)
    if rate_info["exceeded"]:
        raise HTTPException(status_code=429, detail=rate_info)
    
    try:
        # Delegate to Service
        result = await strategy_service.create_strategy(user_id, strategy_input)
        
        # Inject metadata for frontend
        result["usage"] = monthly_info
        result["rate_limit"] = rate_info
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
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    strategies = await strategy_service.get_user_history(current_user["id"])
    return {
        "history": strategies,
        "count": len(strategies)
    }

@router.get("/history/{strategy_id}")
async def get_strategy_by_id(strategy_id: str, current_user: dict = Depends(get_current_user)):
    strategy_doc = await strategy_service.get_strategy_by_id(strategy_id, current_user["id"])
    if not strategy_doc:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strategy_doc

@router.delete("/history/{strategy_id}")
async def delete_strategy(strategy_id: str, current_user: dict = Depends(get_current_user)):
    result = await strategy_service.delete_strategy(strategy_id, current_user["id"])
    if not result["success"]:
        raise HTTPException(status_code=result.get("code", 500), detail=result["message"])
    
    # Broadcast live event
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
