from fastapi import APIRouter, Depends, HTTPException
from app.services.analytics_service import analytics_service
from app.dependencies.auth import get_current_user, RoleChecker
from app.core.mongo import db
import logging

router = APIRouter(prefix="/api/analytics", tags=["Intelligence"])
logger = logging.getLogger(__name__)

# RBAC Dependencies
allow_admin = RoleChecker(["admin", "superadmin"])

@router.get("/profile")
async def get_user_analytics(current_user: dict = Depends(get_current_user)):
    """GET user specific analytics dashboard data"""
    try:
        user_id = str(current_user["_id"])
        data = await analytics_service.get_user_analytics(user_id)
        return data
    except Exception as e:
        logger.error(f"Error fetching user analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to load intelligence data")

@router.get("/admin")
async def get_admin_analytics(current_user: dict = Depends(allow_admin)):
    """GET high-level system analytics (Admin Only)"""
    try:
        # Caching logic could go here (Redis)
        data = await analytics_service.get_analytics()
        return data
    except Exception as e:
        logger.error(f"Error fetching admin analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to load system intelligence")

@router.get("/admin/ai-usage")
async def get_ai_usage_detailed(current_user: dict = Depends(allow_admin)):
    """GET granular AI usage and cost distribution (Admin Only)"""
    try:
        analytics = await analytics_service.get_analytics()
        return analytics.get("ai_usage", {})
    except Exception as e:
        logger.error(f"Error fetching detailed AI usage: {e}")
        raise HTTPException(status_code=500, detail="Failed to load AI usage data")
