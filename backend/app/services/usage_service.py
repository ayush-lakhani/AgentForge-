from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from app.core.mongo import db, users_collection
from bson import ObjectId

class UsageService:
    FREE_MONTHLY_LIMIT = 3
    BURST_LIMIT_SECONDS = 18000  # 5 hours
    
    async def check_monthly_limit(self, user_id: str, tier: str = "free") -> dict:
        """
        Check if user has exceeded monthly strategy generation limit.
        Pro/Expert users bypass this limit.
        """
        if tier in ("pro", "expert"):
            return {"exceeded": False, "used": 0, "limit": None}
        
        current_month = datetime.now(timezone.utc).strftime("%Y-%m")
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        usage_month = user.get("usage_month", "")
        usage_count = user.get("usage_count", 0)
        
        # Monthly reset tracking
        if usage_month != current_month:
            users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"usage_count": 0, "usage_month": current_month}}
            )
            usage_count = 0
        
        if usage_count >= self.FREE_MONTHLY_LIMIT:
            return {
                "exceeded": True,
                "message": f"Free tier limit ({self.FREE_MONTHLY_LIMIT} strategies/month) reached.",
                "used": usage_count,
                "limit": self.FREE_MONTHLY_LIMIT
            }
        
        return {
            "exceeded": False,
            "used": usage_count,
            "limit": self.FREE_MONTHLY_LIMIT
        }

    async def check_burst_limit(self, user_id: str, tier: str = "free") -> dict:
        """
        Check if user has exceeded burst rate limit (e.g., 10 per 5 hours for free tier).
        """
        limits = {
            "free": 10,
            "pro": 50,
            "expert": 100
        }
        limit = limits.get(tier, 10)
        
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(seconds=self.BURST_LIMIT_SECONDS)
        
        used = db.rate_limits.count_documents({
            "user_id": user_id,
            "timestamp": {"$gte": window_start}
        })
        
        if used >= limit:
            return {
                "exceeded": True,
                "message": f"Burst rate limit reached ({limit} requests per 5h).",
                "used": used,
                "limit": limit
            }
        
        # Log attempt (non-blocking)
        db.rate_limits.insert_one({
            "user_id": user_id,
            "timestamp": now
        })
        
        return {
            "exceeded": False,
            "used": used + 1,
            "limit": limit
        }

usage_service = UsageService()
