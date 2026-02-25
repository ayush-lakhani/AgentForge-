from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.dependencies.auth import get_current_user
from app.services.profile_service import profile_service
from app.models.schemas import (
    ProfileHeroResponse,
    ProfileAnalyticsResponse,
    ActivityItem,
    BillingResponse
)

router = APIRouter(prefix="/api/profile", tags=["Profile Intelligence"])

@router.get("", response_model=ProfileHeroResponse)
async def get_profile_hero(current_user: dict = Depends(get_current_user)):
    """Fetch profile hero stats (Synchronous with JWT)"""
    return await profile_service.get_dashboard_stats(current_user)

@router.get("/analytics", response_model=ProfileAnalyticsResponse)
async def get_profile_analytics(current_user: dict = Depends(get_current_user)):
    """Fetch dynamic analytics data for Recharts"""
    return await profile_service.get_analytics(current_user)

@router.get("/activity", response_model=List[ActivityItem])
async def get_profile_activity(current_user: dict = Depends(get_current_user)):
    """Fetch chronological activity timeline"""
    return await profile_service.get_activity(current_user)

@router.get("/billing", response_model=BillingResponse)
async def get_profile_billing(current_user: dict = Depends(get_current_user)):
    """Fetch billing status and usage limits"""
    return await profile_service.get_billing(current_user)
