from app.orchestrator.crew_orchestrator import StrategyOrchestrator
from app.models.schemas import StrategyInput
from app.core.mongo import strategies_collection
from app.core.redis import redis_client
from app.services.versioning_service import versioning_service
from datetime import datetime, timedelta, timezone
from bson import ObjectId
import hashlib
import json

class StrategyService:
    def __init__(self):
        self.orchestrator = StrategyOrchestrator()

    async def create_strategy(self, user_id: str, strategy_input: StrategyInput) -> dict:
        """
        Full lifecycle: Check Cache -> Generate (Orchestrator) -> Save DB -> Update Cache
        """
        
        # 1. Check Cache
        cache_key = self._generate_cache_key(strategy_input)
        cached_strategy = self._get_cached_strategy(cache_key)
        if cached_strategy:
            return {
                "success": True,
                "strategy": cached_strategy,
                "cached": True,
                "generation_time": 0.0,
                "message": "Strategy retrieved from cache"
            }

        # 2. Generate via Orchestrator
        start_time = datetime.now()
        try:
            strategy_data = self.orchestrator.generate_strategy(strategy_input)
        except Exception as e:
            raise e # Router will handle 500

        generation_time = (datetime.now() - start_time).total_seconds()

        # 3. Add Metadata
        DifficultyScore = 8 if strategy_input.strategy_mode == 'aggressive' else 4
        ConfidenceScore = 85 if strategy_input.strategy_mode == 'conservative' else 70
        GrowthScore = 90 if strategy_input.strategy_mode == 'aggressive' else 60

        strategy_data["metadata"] = {
            "generated_at": datetime.now().isoformat(),
            "difficulty_score": DifficultyScore,
            "confidence_score": ConfidenceScore,
            "growth_velocity_score": GrowthScore,
            "token_usage": 0,
            "generation_time": generation_time
        }

        # 4. Save to DB (Versioning)
        new_version = versioning_service.get_next_version(user_id, strategy_input)
        
        strategy_doc = {
            "user_id": user_id,
            "goal": strategy_input.goal,
            "audience": strategy_input.audience,
            "industry": strategy_input.industry,
            "platform": strategy_input.platform,
            "content_type": strategy_input.contentType,
            "strategy_mode": strategy_input.strategy_mode,
            "version": new_version,
            "metadata": strategy_data["metadata"],
            # Flattened structure for easier access
            "strategic_overview": strategy_data.get("strategic_overview"),
            "content_pillars": strategy_data.get("content_pillars"),
            "content_calendar": strategy_data.get("content_calendar"),
            "keywords": strategy_data.get("keywords"),
            "roi_prediction": strategy_data.get("roi_prediction"),
            "cache_key": cache_key,
            "generation_time": int(generation_time),
            "created_at": datetime.now(timezone.utc),
            "is_deleted": False
        }

        result = strategies_collection.insert_one(strategy_doc)

        # 5. Update Cache
        self._set_cached_strategy(cache_key, strategy_data)
        
        # 6. Increment Usage in User document (MongoDB - source of truth)
        self._increment_usage_mongo(user_id)
        
        # 7. Also increment Redis counter (for fast reads, non-authoritative)
        self._increment_usage_redis(user_id)

        return {
            "success": True,
            "strategy": strategy_data,
            "cached": False,
            "generation_time": generation_time,
            "message": "Strategy generated successfully",
            "version": new_version,
            "id": str(result.inserted_id)
        }

    async def get_user_history(self, user_id: str, limit: int = 50) -> list:
        strategies = list(strategies_collection.find({
            "user_id": user_id,
            "is_deleted": {"$ne": True}
        }).sort("created_at", -1).limit(limit))
        
        for s in strategies:
            s["id"] = str(s["_id"])
            s["_id"] = str(s["_id"])
            if isinstance(s.get("created_at"), datetime):
                s["created_at"] = s["created_at"].isoformat()
        return strategies or []

    async def get_strategy_by_id(self, strategy_id: str, user_id: str) -> dict:
        try:
            strategy_doc = strategies_collection.find_one({
                "_id": ObjectId(strategy_id),
                "user_id": user_id
            })
        except Exception:
            return None
            
        if not strategy_doc:
            return None
        
        # Clean and Flatten
        strategy_doc["id"] = str(strategy_doc["_id"])
        strategy_doc["_id"] = str(strategy_doc["_id"])
        if isinstance(strategy_doc.get("created_at"), datetime):
            strategy_doc["created_at"] = strategy_doc["created_at"].isoformat()

        # Flatten output_data if existing (legacy support)
        if "output_data" in strategy_doc and isinstance(strategy_doc["output_data"], dict):
            output_data = strategy_doc.pop("output_data")
            strategy_doc.update(output_data)
            
        return strategy_doc

    async def delete_strategy(self, strategy_id: str, user_id: str) -> dict:
        """
        Soft delete only. Does NOT modify usage_count.
        Deleting a strategy must never restore usage credits.
        """
        try:
            result = strategies_collection.update_one(
                {"_id": ObjectId(strategy_id), "user_id": user_id},
                {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc)}}
            )
            if result.modified_count > 0:
                return {"success": True, "message": "Strategy deleted"}
            
            # Check existence
            doc = strategies_collection.find_one({"_id": ObjectId(strategy_id), "user_id": user_id})
            if not doc:
                return {"success": False, "message": "Not found", "code": 404}
            if doc.get("is_deleted"):
                 return {"success": True, "message": "Already deleted"}
                 
            return {"success": False, "message": "Delete failed", "code": 500}
        except Exception:
            return {"success": False, "message": "Invalid ID", "code": 400}

    async def get_user_usage_stats(self, user_id: str) -> dict:
        """
        Read usage_count from User document (source of truth).
        Falls back to counting strategy documents for legacy users
        who don't have usage_count/usage_month fields yet.
        """
        from app.core.mongo import users_collection
        
        current_month = datetime.now(timezone.utc).strftime("%Y-%m")
        
        # Read from User document (authoritative source)
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        
        if user and "usage_count" in user:
            usage_month = user.get("usage_month", "")
            if usage_month == current_month:
                usage_count = user.get("usage_count", 0)
            else:
                # Month changed — reset usage (lazy reset)
                users_collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {"usage_count": 0, "usage_month": current_month}}
                )
                usage_count = 0
        else:
            # Legacy user: fallback to counting strategy documents
            # and initialize the usage fields
            now = datetime.now(timezone.utc)
            month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
            usage_count = strategies_collection.count_documents({
                "user_id": user_id,
                "created_at": {"$gte": month_start}
            })
            # Backfill usage fields for this legacy user
            users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"usage_count": usage_count, "usage_month": current_month}}
            )
        
        # Total strategies (all time, for display)
        total_strategies = strategies_collection.count_documents({
            "user_id": user_id
        })
        
        return {
            "usage_count": usage_count,
            "total_strategies": total_strategies
        }

    # ========================================================================
    # USAGE TRACKING HELPERS
    # ========================================================================

    def _increment_usage_mongo(self, user_id: str):
        """
        Atomically increment usage_count in the User document.
        Handles monthly reset: if usage_month differs from current month,
        reset count to 1 and update the month.
        """
        from app.core.mongo import users_collection
        
        current_month = datetime.now(timezone.utc).strftime("%Y-%m")
        
        # Try to increment if same month
        result = users_collection.update_one(
            {"_id": ObjectId(user_id), "usage_month": current_month},
            {"$inc": {"usage_count": 1}}
        )
        
        if result.matched_count == 0:
            # Month changed or fields don't exist — reset to 1
            users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"usage_count": 1, "usage_month": current_month}}
            )

    def _generate_cache_key(self, strategy_input: StrategyInput) -> str:
        version = "v2"
        input_str = f"{version}|{strategy_input.goal}|{strategy_input.audience}|{strategy_input.industry}|{strategy_input.platform}|{strategy_input.contentType}|{strategy_input.experience}"
        return hashlib.md5(input_str.encode()).hexdigest()

    def _get_cached_strategy(self, cache_key: str):
        if not redis_client.enabled: return None
        try:
            cached = redis_client.get(f"strategy:{cache_key}")
            return json.loads(cached) if cached else None
        except: return None

    def _set_cached_strategy(self, cache_key: str, strategy: dict, ttl: int = 86400):
        if not redis_client.enabled: return
        try:
            redis_client.setex(f"strategy:{cache_key}", ttl, json.dumps(strategy))
        except: pass

    def _increment_usage_redis(self, user_id: str):
        """Non-authoritative Redis counter for fast reads (optional)."""
        if not redis_client.enabled: return
        try:
            current_month = datetime.now().strftime("%Y-%m")
            count_key = f"strategy_count:{user_id}:{current_month}"
            current_val = redis_client.get(count_key)
            new_count = int(current_val) + 1 if current_val else 1
            redis_client.setex(count_key, 86400, new_count)
        except Exception as e:
            print(f"[WARNING] Failed to increment Redis usage: {e}")

# Singleton
strategy_service = StrategyService()
