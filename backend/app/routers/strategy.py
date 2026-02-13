from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import StrategyInput, StrategyResponse, HistoryResponse
from app.core.security import get_current_user
from app.core.database import strategies_collection, redis_client, REDIS_ENABLED, db
from app.core.config import settings
from app.services.logic import generate_experience_based_strategy, generate_demo_strategy
from app.services.crew import create_content_strategy_crew
from datetime import datetime, timedelta, timezone
import hashlib
import json
import time
from bson import ObjectId

router = APIRouter(prefix="/api", tags=["Strategy"])

# ============================================================================
# RATE LIMITING HELPERS
# ============================================================================

FREE_LIMIT = 10
WINDOW_HOURS = 5

def check_rate_limit(user_id: str, tier: str = "free") -> dict:
    """Check if user has exceeded rate limit based on tier"""
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
            "message": f"{tier.capitalize()} tier limit ({limit}) reached. Resets in {reset_h}h {reset_m}m",
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
    if not REDIS_ENABLED:
        return None
    try:
        cached = redis_client.get(f"strategy:{cache_key}")
        return json.loads(cached) if cached else None
    except:
        return None

def set_cached_strategy(cache_key: str, strategy: dict, ttl: int = 86400):
    if not REDIS_ENABLED:
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
    
    # Rate Limiting
    rate_info = check_rate_limit(user_id, tier)
    if rate_info["exceeded"]:
        raise HTTPException(status_code=429, detail=rate_info)
    
    # Check cache
    cache_key = generate_cache_key(strategy_input)
    cached_strategy = get_cached_strategy(cache_key)
    
    if cached_strategy:
        return {
            "success": True,
            "strategy": cached_strategy,
            "cached": True,
            "generation_time": 0.0,
            "message": "Strategy retrieved from cache"
        }
    
    # Generate Strategy
    start_time = time.time()
    
    # 1. Blueprint Logic
    blueprint_input = strategy_input.dict()
    blueprint_input["topic"] = strategy_input.goal[:50]
    blueprint_html, sample_posts = generate_experience_based_strategy(blueprint_input)
    
    # 2. AI Logic
    if settings.GROQ_API_KEY:
        try:
            print(f"🤖 [CREWAI] Starting Strategy Generation for: {strategy_input.goal}")
            print(f"via Agent Crew (Model: Llama-3.3-70B)")
            strategy_dict = create_content_strategy_crew(strategy_input)
            message = "Strategy generated successfully"
            print(f"✅ [CREWAI] Generation Complete! (Time: {time.time() - start_time:.2f}s)")
        except Exception as e:
            print(f"❌ [CREWAI] Error: {str(e)}")
            print("⚠️ [FALLBACK] Switching to Demo Mode...")
            strategy_dict = generate_demo_strategy(strategy_input)
            message = f"⚠️ CrewAI error, using demo: {str(e)}"
    else:
        print("⚠️ [DEMO MODE] No Groq API Key found. Using demo strategy.")
        strategy_dict = generate_demo_strategy(strategy_input)
        message = "⚠️ DEMO MODE: No Groq API Key found"
    
    # 3. Merge - KEEP ALL CrewAI data!
    strategy_dict["tactical_blueprint"] = blueprint_html
    strategy_dict["sample_posts"] = sample_posts
    
    generation_time = time.time() - start_time
    
    # Cache result
    if "CrewAI error" not in message:
        set_cached_strategy(cache_key, strategy_dict)
    
    # Use FULL strategy_dict - NO data loss!
    clean_strategy = strategy_dict.copy()

    # Save to MongoDB
    strategy_doc = {
        "user_id": user_id,
        "goal": strategy_input.goal,
        "audience": strategy_input.audience,
        "industry": strategy_input.industry,
        "platform": strategy_input.platform,
        "output_data": clean_strategy,
        "cache_key": cache_key,
        "generation_time": int(generation_time),
        "created_at": datetime.now(timezone.utc)
    }
    result = strategies_collection.insert_one(strategy_doc)
    
    # Increment Redis Usage
    if REDIS_ENABLED:
        try:
            current_month = datetime.now().strftime("%Y-%m")
            count_key = f"strategy_count:{user_id}:{current_month}"
            current_val = redis_client.get(count_key)
            new_count = int(current_val) + 1 if current_val else 1
            redis_client.setex(count_key, 86400, new_count)
        except Exception as e:
            print(f"[WARNING] Failed to increment usage: {e}")

    # Return flattened data for frontend (clean_strategy already has all fields at top level)
    return {
        "success": True,
        "strategy": clean_strategy,  # Already flattened with ALL 6 modes!
        "cached": False,
        "generation_time": generation_time,
        "message": message,
        "usage": rate_info,
        "tier": tier
    }


@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    strategies = list(strategies_collection.find({
        "user_id": current_user["id"]
    }).sort("created_at", -1).limit(50))
    
    for s in strategies:
        s["id"] = str(s["_id"])
        s["_id"] = str(s["_id"])
        if isinstance(s.get("created_at"), datetime):
            s["created_at"] = s["created_at"].isoformat()
            
    return {
        "history": strategies or [],
        "count": len(strategies)
    }

# NEW: Get specific strategy
@router.get("/history/{strategy_id}")
async def get_strategy_by_id(strategy_id: str, current_user: dict = Depends(get_current_user)):
    print(f"DEBUG: get_strategy_by_id called with ID: {strategy_id}")
    try:
        strategy_doc = strategies_collection.find_one({
            "_id": ObjectId(strategy_id),
            "user_id": current_user["id"]
        })
        print(f"DEBUG: Found doc: {strategy_doc is not None}")
    except Exception as e:
        print(f"DEBUG: Error finding strategy: {e}")
        strategy_doc = None
        
    if not strategy_doc:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    # Clean doc for JSON response
    strategy_doc["id"] = str(strategy_doc["_id"])
    strategy_doc["_id"] = str(strategy_doc["_id"])
    if isinstance(strategy_doc.get("created_at"), datetime):
        strategy_doc["created_at"] = strategy_doc["created_at"].isoformat()
    
    # FIX: Flatten output_data to top level so frontend can access it
    # The frontend expects: { personas: [...], keywords: [...], strategic_guidance: {...}, ... }
    # But we saved it as: { output_data: { personas: [...], keywords: [...], ... } }
    if "output_data" in strategy_doc and isinstance(strategy_doc["output_data"], dict):
        # Merge output_data fields to top level
        output_data = strategy_doc.pop("output_data")
        strategy_doc.update(output_data)
        print(f"DEBUG: Flattened output_data to top level. Keys: {list(strategy_doc.keys())}")
        
    return strategy_doc

# NEW: Delete specific strategy
@router.delete("/history/{strategy_id}")
async def delete_strategy(strategy_id: str, current_user: dict = Depends(get_current_user)):
    print(f"DEBUG: delete_strategy called with ID: {strategy_id}")
    try:
        result = strategies_collection.delete_one({
            "_id": ObjectId(strategy_id),
            "user_id": current_user["id"]
        })
        print(f"DEBUG: Delete result count: {result.deleted_count}")
    except Exception as e:
        print(f"DEBUG: Error deleting strategy: {e}")
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Strategy not found")
        
    return {"success": True, "message": "Strategy deleted"}


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    
    monthly_usage = strategies_collection.count_documents({
        "user_id": current_user["id"],
        "created_at": {"$gte": month_start}
    })
    
    total_strategies = strategies_collection.count_documents({
        "user_id": current_user["id"]
    })
    
    return {
        "email": current_user.get("email"),
        "tier": current_user.get("tier", "free"),
        "usage_count": monthly_usage,
        "total_strategies": total_strategies,
        "created_at": current_user.get("created_at"),
        "razorpay_subscription_id": current_user.get("razorpay_subscription_id")
    }
