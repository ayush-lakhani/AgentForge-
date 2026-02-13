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

class StrategyInput(BaseModel):
    """Input schema for strategy generation"""
    goal: str = Field(..., min_length=5, max_length=500, description="Business goal (e.g., 'Sell coffee on Instagram')")
    audience: str = Field(..., min_length=3, max_length=200, description="Target audience (e.g., 'college students')")
    industry: str = Field(..., min_length=3, max_length=100, description="Industry (e.g., 'F&B', 'SaaS', 'E-commerce')")
    platform: str = Field(..., min_length=3, max_length=50, description="Primary platform (e.g., 'Instagram', 'LinkedIn')")
    contentType: str = Field(default="Mixed Content", max_length=50, description="Desired content format (e.g., 'Reels', 'Posts', 'Blogs')")
    experience: str = Field(default="beginner", max_length=50, description="User experience level (beginner/intermediate/expert)")

    class Config:
        json_schema_extra = {
            "example": {
                "goal": "Sell coffee subscriptions on Instagram",
                "audience": "college students aged 18-24",
                "industry": "F&B",
                "platform": "Instagram",
                "contentType": "Reels/Short Videos"
            }
        }


class PersonaModel(BaseModel):
    """Detailed audience persona"""
    name: str = Field(..., description="Persona name (e.g., 'Broke College Caffeine Addict')")
    age_range: str = Field(..., description="Age range (e.g., '18-24')")
    occupation: str = Field(..., description="Primary occupation")
    pain_points: List[str] = Field(..., description="Top 3-5 pain points")
    desires: List[str] = Field(..., description="Top 3-5 desires/aspirations")
    objections: List[str] = Field(..., description="Common objections to purchase")
    daily_habits: List[str] = Field(..., description="Relevant daily habits")
    content_preferences: List[str] = Field(..., description="Preferred content formats")


class CompetitorGap(BaseModel):
    """Individual competitor gap/opportunity"""
    gap: str = Field(..., description="The missed opportunity")
    impact: str = Field(..., description="Potential impact (High/Medium/Low)")
    implementation: str = Field(..., description="How to exploit this gap")


class KeywordModel(BaseModel):
    """SEO keyword with metadata (SerpAPI enhanced)"""
    term: str = Field(..., description="Keyword phrase")
    intent: str = Field(..., description="Search intent (Informational/Transactional/Navigational)")
    difficulty: str = Field(..., description="Keyword difficulty (Easy/Medium/Hard)")
    monthly_searches: str = Field(..., description="Estimated monthly search volume")
    priority: int = Field(..., ge=1, le=10, description="Priority score (1-10)")
    hashtags: List[str] = Field(default_factory=list, description="Relevant hashtags (5)")


class CalendarItem(BaseModel):
    """Single content calendar entry"""
    week: int = Field(..., ge=1, le=4, description="Week number (1-4)")
    day: int = Field(..., ge=1, le=7, description="Day of week (1-7)")
    topic: str = Field(..., description="Content topic")
    format: str = Field(..., description="Content format (Reel/Carousel/Story/Post)")
    caption_hook: str = Field(..., description="Opening hook for caption")
    cta: str = Field(..., description="Call-to-action")


class SamplePost(BaseModel):
    """Ready-to-use sample post"""
    title: str = Field(..., description="Post title/hook")
    caption: str = Field(..., description="Full post caption")
    hashtags: List[str] = Field(..., description="Recommended hashtags (5-10)")
    image_prompt: str = Field(..., description="AI image generation prompt")
    best_time: str = Field(..., description="Optimal posting time")


class StrategicGuidance(BaseModel):
    """Execution guidance (WHAT/HOW/WHERE/WHY/WHEN)"""
    what_to_do: List[str] = Field(..., description="5-7 specific content types to create")
    how_to_do_it: List[str] = Field(..., description="5-7 tactical execution tips")
    where_to_post: Dict = Field(..., description="Platform-specific posting locations")
    when_to_post: Dict = Field(..., description="Timing strategy (days/times/frequency)")
    what_to_focus_on: List[str] = Field(..., description="5 key success metrics")
    why_it_works: List[str] = Field(..., description="5 psychological/strategic reasons")
    productivity_boosters: List[str] = Field(..., description="5 efficiency tips")
    things_to_avoid: List[str] = Field(..., description="5 common mistakes to avoid")


class ROIPrediction(BaseModel):
    """ROI and performance predictions"""
    traffic_lift_percentage: str = Field(..., description="Expected traffic increase (e.g., '23%')")
    engagement_boost_percentage: str = Field(..., description="Expected engagement lift (e.g., '41%')")
    estimated_monthly_reach: str = Field(..., description="Projected audience reach (e.g., '5K-10K')")
    conversion_rate_estimate: str = Field(..., description="Expected conversion rate (e.g., '2-3%')")
    time_to_results: str = Field(..., description="Expected timeline (e.g., '30-60 days')")


class ContentStrategy(BaseModel):
    """Complete content strategy output - PRODUCTION SCHEMA"""
    personas: List[PersonaModel]
    competitor_gaps: List[CompetitorGap]
    strategic_guidance: StrategicGuidance
    keywords: List[KeywordModel]
    calendar: List[CalendarItem]
    sample_posts: List[SamplePost]
    roi_prediction: ROIPrediction

    class Config:
        json_schema_extra = {
            "example": {
                "persona": {
                    "name": "Broke College Caffeine Addict",
                    "age_range": "18-24",
                    "occupation": "Full-time Student",
                    "pain_points": ["$5 latte guilt", "Tired between classes"],
                    "desires": ["Affordable quality coffee", "Study fuel"],
                    "objections": ["Too expensive", "Not sustainable"],
                    "daily_habits": ["Checks Instagram 5x/day", "Listens to podcasts"],
                    "content_preferences": ["Quick tips", "Behind-the-scenes"]
                },
                "roi_prediction": {
                    "traffic_lift_percentage": "23%",
                    "engagement_boost_percentage": "41%",
                    "estimated_monthly_reach": "5K-10K",
                    "conversion_rate_estimate": "2-3%",
                    "time_to_results": "30-45 days"
                }
            }
        }


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
    created_at: datetime

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
    created_at: datetime
    generation_time: Optional[int]

    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    """List of user's past strategies"""
    success: bool
    strategies: List[StrategyHistoryItem]
    total: int
