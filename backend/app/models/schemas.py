"""
Data models and schemas for the Content Strategy Planner
Includes both Pydantic models (for API validation)
"""

from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, EmailStr, Field

# ============================================================================
# PYDANTIC MODELS (API Request/Response Schemas)
# ============================================================================

# ============================================================================
# PYDANTIC MODELS (API Request/Response Schemas)
# ============================================================================

class StrategyInput(BaseModel):
    """Input schema for strategy generation"""
    goal: str = Field(..., min_length=10, max_length=500, description="Business goal")
    audience: str = Field(..., min_length=5, max_length=200, description="Target audience")
    industry: str = Field(..., min_length=3, max_length=100, description="Industry")
    platform: str = Field(..., min_length=3, max_length=50, description="Primary platform")
    contentType: str = Field(default="Mixed Content", max_length=50, description="Content format")
    experience: str = Field(default="beginner", max_length=50, description="Experience level")
    strategy_mode: str = Field(default="conservative", pattern="^(conservative|aggressive)$", description="Risk/Innovation level")

    class Config:
        json_schema_extra = {
            "example": {
                "goal": "Sell premium coffee subscriptions to remote workers",
                "audience": "Remote tech workers aged 25-35",
                "industry": "F&B",
                "platform": "Instagram",
                "contentType": "Reels",
                "strategy_mode": "aggressive"
            }
        }
        brand_name: Optional[str] = None   # 👈 ADD THIS

# --- Nested Models for ContentStrategy ---

class StrategyMetadata(BaseModel):
    generated_at: str
    difficulty_score: int
    confidence_score: int
    growth_velocity_score: int
    token_usage: Optional[int] = 0

class StrategicOverview(BaseModel):
    growth_objective: str
    target_persona_snapshot: str
    positioning_angle: str
    competitive_edge: str

class SamplePostContent(BaseModel):
    format: str
    hook: str
    script_or_structure: str
    caption: str
    cta: str
    image_prompt: Optional[str] = None # Added back for image generation support

class ContentPillar(BaseModel):
    pillar_name: str
    why_it_works: str
    sample_posts: List[SamplePostContent]

class KeywordStats(BaseModel):
    primary: List[str]
    long_tail: List[str]
    hashtags: List[str]

class ROIStats(BaseModel):
    traffic_lift_percentage: str # e.g. "15-25%" - keeping as string for range
    engagement_boost_percentage: str
    estimated_monthly_reach: str
    conversion_rate_estimate: str
    risk_level: str # Low/Medium/High

class CalendarEntry(BaseModel):
    day: int
    format: str
    theme: str
    
class ContentStrategy(BaseModel):
    """Complete content strategy output - NEW 5-AGENT SCHEMA"""
    metadata: StrategyMetadata
    strategic_overview: StrategicOverview
    content_pillars: List[ContentPillar]
    content_calendar: List[CalendarEntry]
    keywords: KeywordStats
    roi_prediction: ROIStats

class StrategyResponse(BaseModel):
    """API response wrapper"""
    success: bool
    strategy: ContentStrategy
    cached: bool = False
    generation_time: float
    message: str = "Strategy generated successfully"


# ============================================================================
# AUTHENTICATION MODELS
# ============================================================================

class UserCreate(BaseModel):
    """User registration schema"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user_id: str  # Changed from int to str for MongoDB ObjectId
    email: str


class UserResponse(BaseModel):
    """User data response"""
    id: str  # Changed from int to str for MongoDB ObjectId
    email: str
    tier: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# HISTORY RESPONSE
# ============================================================================

class StrategyHistoryItem(BaseModel):
    """Single history item"""
    id: str
    goal: str
    audience: str
    industry: str
    platform: str
    created_at: Optional[datetime] = None
    generation_time: Optional[int]

    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    """List of user's past strategies"""
    success: bool
    strategies: List[StrategyHistoryItem]
    total: int

# ============================================================================
# DASHBOARD & PROFILE SCHEMAS
# ============================================================================

class AnalyticsDataPoint(BaseModel):
    date: str
    count: int

class TokenUsagePoint(BaseModel):
    date: str
    tokens: int

class GrowthTrendPoint(BaseModel):
    month: str
    value: int

class ProfileAnalyticsResponse(BaseModel):
    monthly_strategies: List[AnalyticsDataPoint]
    token_usage: List[TokenUsagePoint]
    growth_trend: List[GrowthTrendPoint]

class ActivityItem(BaseModel):
    type: str
    timestamp: Optional[datetime] = None
    title: str

class BillingResponse(BaseModel):
    plan: str
    monthly_limit: int
    used_this_month: int
    renewal_date: Optional[str] = None

class ProfileHeroResponse(BaseModel):
    name: str
    email: str
    tier: str
    member_since: Optional[datetime] = None
    total_strategies: int
    tokens_used_month: int
    next_billing_date: Optional[str]
