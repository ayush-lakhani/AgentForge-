from datetime import datetime, timedelta, timezone
from typing import List, Dict
from bson import ObjectId
from app.core import mongo
from app.models.schemas import (
    ProfileHeroResponse,
    ProfileAnalyticsResponse,
    AnalyticsDataPoint,
    TokenUsagePoint,
    GrowthTrendPoint,
    ActivityItem,
    BillingResponse
)

class ProfileService:
    async def get_dashboard_stats(self, user: dict) -> ProfileHeroResponse:
        """Fetch primary dashboard stats for the hero card"""
        user_id = str(user["_id"])
        
        # Total strategies
        total_strategies = mongo.strategies_collection.count_documents({"user_id": user_id})
        
        # Token usage this month (aggregation)
        now = datetime.now(timezone.utc)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        pipeline = [
            {"$match": {
                "user_id": user_id,
                "created_at": {"$gte": start_of_month}
            }},
            {"$group": {
                "_id": None,
                "total_tokens": {"$sum": {"$ifNull": ["$tokens_used", 800]}}
            }}
        ]
        token_results = list(mongo.strategies_collection.aggregate(pipeline))
        tokens_used_month = token_results[0]["total_tokens"] if token_results else 0
        
        # Next billing date
        created_at = user.get("created_at")
        next_billing = (created_at + timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%S") if created_at else None
        
        return ProfileHeroResponse(
            name=user.get("name", user["email"].split("@")[0]),
            email=user["email"],
            tier=user.get("tier", "free"),
            member_since=user.get("created_at"),
            total_strategies=total_strategies,
            tokens_used_month=tokens_used_month,
            next_billing_date=next_billing
        )

    async def get_analytics(self, user: dict) -> ProfileAnalyticsResponse:
        """Aggregate 30-day trends for the user"""
        user_id = str(user["_id"])
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        
        # Monthly Strategies Chart Data
        strat_pipeline = [
            {"$match": {
                "user_id": user_id,
                "created_at": {"$gte": thirty_days_ago}
            }},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        strat_data = [AnalyticsDataPoint(date=r["_id"], count=r["count"]) 
                     for r in mongo.strategies_collection.aggregate(strat_pipeline)]
        
        # Token Usage Chart Data
        token_pipeline = [
            {"$match": {
                "user_id": user_id,
                "created_at": {"$gte": thirty_days_ago}
            }},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "tokens": {"$sum": {"$ifNull": ["$tokens_used", 800]}}
            }},
            {"$sort": {"_id": 1}}
        ]
        token_data = [TokenUsagePoint(date=r["_id"], tokens=r["tokens"]) 
                     for r in mongo.strategies_collection.aggregate(token_pipeline)]
        
        # Growth Trend (Dummy calculation for now based on cumulative strategies)
        growth_data = [
            GrowthTrendPoint(month="Jan", value=10),
            GrowthTrendPoint(month="Feb", value=25),
            GrowthTrendPoint(month="Mar", value=total_strategies if 'total_strategies' in locals() else 35)
        ]
        
        return ProfileAnalyticsResponse(
            monthly_strategies=strat_data,
            token_usage=token_data,
            growth_trend=growth_data
        )

    async def get_activity(self, user: dict, limit: int = 10) -> List[ActivityItem]:
        """Fetch recent activity for the timeline"""
        user_id = str(user["_id"])
        
        # Fetch recent strategies
        recent_strats = list(mongo.strategies_collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit))
        
        activity = []
        for s in recent_strats:
            activity.append(ActivityItem(
                type="strategy_created",
                timestamp=s["created_at"],
                title=f"Generated {s.get('platform', 'Content')} Strategy: {s.get('goal', '')[:30]}..."
            ))
            
        # Add a billing event example
        activity.append(ActivityItem(
            type="billing_update",
            timestamp=user.get("created_at", datetime.now(timezone.utc)),
            title=f"Account created on {user.get('tier', 'free').capitalize()} Plan"
        ))
        
        # Sort combined activity
        activity.sort(key=lambda x: x.timestamp, reverse=True)
        return activity[:limit]

    async def get_billing(self, user: dict) -> BillingResponse:
        """Calculate billing and usage limits"""
        user_id = str(user["_id"])
        
        usage_count = mongo.strategies_collection.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": datetime.now(timezone.utc).replace(day=1)}
        })
        
        created_at = user.get("created_at")
        renewal_date = (created_at + timedelta(days=30)).isoformat() if created_at else None
        
        return BillingResponse(
            plan=user.get("tier", "free").capitalize(),
            monthly_limit=999 if user.get("tier") == "pro" else 3,
            used_this_month=usage_count,
            renewal_date=renewal_date
        )

profile_service = ProfileService()
