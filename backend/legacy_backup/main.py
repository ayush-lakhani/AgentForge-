"""
FastAPI Backend with MongoDB for AI Content Strategy Planner
Production-ready with JWT auth, Redis caching, rate limiting, and CrewAI integration
"""

from fastapi import FastAPI, Depends, HTTPException, status, Request, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
import redis
import hashlib
import json
import time
import os
from typing import Optional
try:
    from models import StrategyInput, UserCreate, UserLogin, Token, StrategyResponse, HistoryResponse
except ImportError:
    from .models import StrategyInput, UserCreate, UserLogin, Token, StrategyResponse, HistoryResponse
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from dotenv import load_dotenv # Added for loading environment variables
load_dotenv()

# Suppress Pydantic V2 protected namespace warning
import warnings
warnings.filterwarnings("ignore", message=".*Field \"model_name\" in EmbeddingOptions has conflict with protected namespace \"model_\".*")

print("DEBUG: Starting main.py execution...")

# Fix for Windows Unicode printing
import sys
import io
if sys.platform == 'win32':
    try:
        # Check if already utf-8
        if getattr(sys.stdout, 'encoding', None) != 'utf-8':
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except Exception as e:
        pass

# ============================================================================
# ADMIN AUTHENTICATION (SEPARATE FROM USER JWT)
# ============================================================================
from fastapi import Header

# Admin secret key (environment variable)
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "agentforge-admin-2026-change-now")

async def admin_auth(authorization: Optional[str] = Header(None)):
    """
    Admin-only authentication using secret key (NOT user JWT)
    Separate authentication system for admin panel
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authorization required"
        )
    
    # Extract token from "Bearer <token>" format
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    # Validate admin secret
    if token != ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin secret"
        )
    
    return True

# Rate Limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Razorpay for Payments
import razorpay

# Async and Streaming Support
import asyncio
import uuid
from fastapi import BackgroundTasks
from fastapi.responses import StreamingResponse

# Try to enable CrewAI - falls back to demo mode if import fails
CREW_AI_ENABLED = False
try:
    from crew import create_content_strategy_crew
    CREW_AI_ENABLED = True
    print("[INFO] CrewAI Multi-Agent System Enabled (5 Elite Agents)")
    print("[INFO] Agents: Audience Surgeon | Trend Sniper | Traffic Architect | Strategy Synthesizer | ROI Predictor")
except Exception as e:
    print(f"[WARNING] CrewAI import failed: {str(e)}")
    print("[INFO] Using Demo Strategy Generator (Python 3.13 compatible)")


# =============================================================================
# OPENAI-STYLE RATE LIMITING (MongoDB Rolling Window)
# =============================================================================

FREE_LIMIT = 10
WINDOW_HOURS = 5

def check_rate_limit(user_id: str, tier: str = "free") -> dict:
    """Check if user has exceeded rate limit based on tier"""
    # Define limits based on tier
    if tier == "pro":
        limit = 50  # Pro users get 50 generations per window
    elif tier == "expert":
        limit = 100 # Expert users get 100 generations per window
    else:
        limit = FREE_LIMIT # Free users get 10 (default)

    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=WINDOW_HOURS)
    
    # 1. Clean up old limits (optimization: only delete if creating new entry)
    # db.rate_limits.delete_many(...) - Skipping for speed, relying on TTL or periodic cleanup
    
    # 2. Count usage in window
    used = db.rate_limits.count_documents({
        "user_id": user_id,
        "timestamp": {"$gte": window_start}
    })
    
    if used >= limit:
        reset_time = window_start + timedelta(hours=WINDOW_HOURS)
        # Handle case where reset time is in the past (edge case)
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
    
    # Usage is recorded AFTER successful generation in the main endpoint
    # This function just CHECKS the limit
    
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
# NEW API ENDPOINTS (FIXED)
# ============================================================================


# ============================================================================
# CONFIGURATION
# ============================================================================

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

# Environment Variables
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Razorpay Configuration
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_PLAN_ID = os.getenv("RAZORPAY_PLAN_ID", "")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
RAZORPAY_ENABLED = bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)

# Initialize Razorpay client
if RAZORPAY_ENABLED:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
else:
    razorpay_client = None

# Rate Limiting Configuration
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "30"))

# Password hashing - Using bcrypt for production security
from passlib.context import CryptContext
import hashlib
import secrets

# Initialize bcrypt context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password_sha256(password: str, salt: str = None) -> str:
    """Legacy SHA256 hash - kept for backward compatibility"""
    if salt is None:
        salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${pwd_hash}"

def verify_password_sha256(password: str, hashed: str) -> bool:
    """Legacy SHA256 verify - kept for backward compatibility"""
    try:
        salt, pwd_hash = hashed.split('$')
        return hashlib.sha256((password + salt).encode()).hexdigest() == pwd_hash
    except:
        return False

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    # Bcrypt has a 72-byte limit, truncate if necessary
    if len(password.encode('utf-8')) > 72:
        password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    """Verify password - supports both bcrypt and legacy SHA256"""
    # Try bcrypt first
    if hashed.startswith("$2b$") or hashed.startswith("$2a$"):
        return pwd_context.verify(password, hashed)
    # Fall back to SHA256 for legacy users
    else:
        return verify_password_sha256(password, hashed)

security = HTTPBearer()

# ============================================================================
# MONGODB SETUP
# ============================================================================

print("DEBUG: Connecting to MongoDB...")
mongo_client = MongoClient(MONGODB_URL)
print("DEBUG: MongoDB initialized.")
db = mongo_client.content_planner

# Collections
users_collection = db.users
strategies_collection = db.strategies

# Create indexes
users_collection.create_index("email", unique=True)
strategies_collection.create_index("user_id")
strategies_collection.create_index("cache_key")
strategies_collection.create_index("created_at")
strategies_collection.create_index([("user_id", 1), ("created_at", -1)])

# ============================================================================
# REDIS SETUP
# ============================================================================

try:
    print("DEBUG: Connecting to Redis...")
    # Add timeout to prevent hang
    redis_client = redis.from_url(REDIS_URL, decode_responses=True, socket_timeout=2, socket_connect_timeout=2)
    print("DEBUG: Pinging Redis...")
    redis_client.ping()
    print("DEBUG: Redis connected.")
    REDIS_ENABLED = True
except Exception as e:
    print(f"DEBUG: Redis connection failed: {e}")
    REDIS_ENABLED = False
    print(f"[WARNING] Redis not available - {e}")
    print("[WARNING] Rate limiting disabled")

# ============================================================================
# FASTAPI APP
# ============================================================================

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{RATE_LIMIT_PER_MINUTE}/minute"])

app = FastAPI(
    title="AgentForge",
    description="AI-Powered Content Strategy Platform | 5 Elite Agents | ROI Predictions | SEO Keywords | Production SaaS",
    version="2.0.0-production"
)

# Add rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# DEBUG: Add Exception Handler for Validation Errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"\n{'='*80}")
    print(f"VALIDATION ERROR at {request.url}")
    print(f"Body: {exc.body}")
    print(f"Errors: {exc.errors()}")
    print(f"{'='*80}\n")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for development to fix CORS issues
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# AUTHENTICATION UTILITIES
# ============================================================================

# Note: verify_password is now defined above with bcrypt support
# Keeping this for reference - the actual function is at line ~95

def get_password_hash(password: str) -> str:
    """Hash password using bcrypt (wrapper for compatibility)"""
    return hash_password(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    user["id"] = str(user["_id"])
    return user

# ============================================================================
# CACHING UTILITIES
# ============================================================================

def generate_cache_key(strategy_input: StrategyInput) -> str:
    version = "v2" # Force cache invalidation for blueprint merge
    input_str = f"{version}|{strategy_input.goal}|{strategy_input.audience}|{strategy_input.industry}|{strategy_input.platform}|{strategy_input.contentType}|{strategy_input.experience}"
    return hashlib.md5(input_str.encode()).hexdigest()

def get_cached_strategy(cache_key: str) -> Optional[dict]:
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


# ============================================================================
# DEMO STRATEGY DATA
# ============================================================================

def generate_demo_strategy(strategy_input: StrategyInput) -> dict:
    """Generate demo strategy when CrewAI is not available"""
    return {
        "personas": [
            {
                "name": f"{strategy_input.audience.title()} Enthusiast (Young)",
                "age_range": "18-24",
                "occupation": "Student/Early Career",
                "pain_points": ["Limited budget", "Time constraints", "Learning curve", "Overwhelmed by options", "Need quick results"],
                "desires": ["Affordable solutions", "Easy to use", "Quick wins", "Build skills", "Feel confident"],
                "objections": ["Too expensive", "Not sure if it works", "Already tried others", "No time to learn", "Quality concerns"],
                "daily_habits": [f"Checks {strategy_input.platform} daily", "Consumes content during commute", "Engages in evening", "Weekend planning", "Follows trends"],
                "content_preferences": ["Short video", "Quick tips", "Behind-the-scenes", "Trendy content", "Mobile-friendly"]
            },
            {
                "name": f"{strategy_input.audience.title()} Professional",
                "age_range": "25-34",
                "occupation": "Working Professional",
                "pain_points": ["Limited time", "Struggling with consistency", "Unsure about strategy", "Algorithm changes", "Difficulty measuring ROI"],
                "desires": ["Grow authentically", "Create easily", "Build brand", "Monetize expertise", "Save time"],
                "objections": ["Too expensive", "Not sure if it works", "Already tried others", "No time to learn", "Quality concerns"],
                "daily_habits": [f"Checks {strategy_input.platform} daily", "Consumes content during commute", "Engages in evening", "Plans on weekends", "Follows influencers"],
                "content_preferences": ["Short video", "Quick tips", "Behind-the-scenes", "UGC", "Data insights"]
            },
            {
                "name": f"{strategy_input.audience.title()} Expert",
                "age_range": "35-45",
                "occupation": "Senior Professional/Manager",
                "pain_points": ["Keeping up with trends", "Delegating content creation", "ROI measurement", "Brand consistency", "Scaling challenges"],
                "desires": ["Efficient systems", "Proven strategies", "Team collaboration", "Authority building", "Long-term growth"],
                "objections": ["Implementation complexity", "Team training needed", "Budget allocation", "Risk of change", "Competitive concerns"],
                "daily_habits": [f"Strategic {strategy_input.platform} review", "Industry research", "Team meetings", "Performance analysis", "Networking"],
                "content_preferences": ["Educational posts", "Case studies", "Industry insights", "Professional content", "Long-form valuable content"]
            }
        ],
        "competitor_gaps": [
            {"gap": "Lack of personalized strategies", "impact": "High", "implementation": "AI personalization engine"},
            {"gap": "No real-time trends", "impact": "High", "implementation": "Trend monitoring"},
            {"gap": "Missing analytics", "impact": "Medium", "implementation": "Performance tracking"},
            {"gap": "Limited platform insights", "impact": "Medium", "implementation": "Platform optimization"},
            {"gap": "No collaboration", "impact": "Low", "implementation": "Team tools"}
        ],
        "keywords": [
            {
                "term": f"{strategy_input.industry.lower()} content ideas", 
                "intent": "Informational", 
                "difficulty": "Easy", 
                "monthly_searches": "5K-10K", 
                "priority": 10,
                "hashtags": [f"#{strategy_input.industry.replace(' ', '')}Content", "#ContentIdeas", "#MarketingTips", "#SocialMediaStrategy", "#ContentCreation"]
            },
            {
                "term": f"grow on {strategy_input.platform.lower()}", 
                "intent": "Informational", 
                "difficulty": "Easy", 
                "monthly_searches": "10K-50K", 
                "priority": 9,
                "hashtags": [f"#{strategy_input.platform}Growth", f"#{strategy_input.platform}Tips", "#SocialMediaGrowth", "#DigitalMarketing", "#GrowYourBusiness"]
            },
            {
                "term": f"{strategy_input.platform.lower()} tips", 
                "intent": "Informational", 
                "difficulty": "Easy", 
                "monthly_searches": "5K-10K", 
                "priority": 8,
                "hashtags": [f"#{strategy_input.platform}Tips", "#SocialMediaTips", "#MarketingHacks", "#ContentStrategy", "#DigitalMarketing"]
            },
            {
                "term": f"{strategy_input.industry.lower()} marketing", 
                "intent": "Transactional", 
                "difficulty": "Medium", 
                "monthly_searches": "5K-10K", 
                "priority": 7,
                "hashtags": [f"#{strategy_input.industry.replace(' ', '')}Marketing", "#IndustryTips", "#B2BMarketing", "#MarketingStrategy", "#BusinessGrowth"]
            },
            {
                "term": f"viral {strategy_input.platform.lower()} content", 
                "intent": "Informational", 
                "difficulty": "Medium", 
                "monthly_searches": "5K-10K", 
                "priority": 6,
                "hashtags": ["#ViralContent", f"#{strategy_input.platform}Viral", "#ContentMarketing", "#SocialMedia", "#Trending"]
            }
        ],
        "strategic_guidance": {
            "what_to_do": ["Behind-the-scenes content", "User testimonials", "Educational carousels", "Quick tip Reels", "Industry insights"],
            "how_to_do_it": ["Hook in first 3 seconds", "Add captions/text overlays", "Use trending audio", "Include clear CTA", "Post consistently"],
            "where_to_post": {
                "primary_platform": strategy_input.platform,
                "posting_locations": ["Feed", "Reels", "Stories"],
                "cross_promotion": ["TikTok (repurpose)", "YouTube Shorts"]
            },
            "when_to_post": {
                "best_days": ["Tuesday", "Thursday", "Saturday"],
                "best_times": ["9-11 AM", "1-3 PM", "7-9 PM"],
                "frequency": "3-5 times per week",
                "consistency_tips": ["Batch create on Sundays", "Schedule in advance"]
            },
            "what_to_focus_on": ["Engagement rate over followers", "Save rate for value", "Comment quality", "Share potential", "Watch time"],
            "why_it_works": ["Video captures attention faster", "Consistency trains algorithm", "Value builds trust", "Storytelling creates connection", "Clear CTAs drive action"],
            "productivity_boosters": ["Batch create content", "Use templates", "Repurpose across platforms", "Set reminders", "Plan 2 weeks ahead"],
            "things_to_avoid": ["Don't post without CTA", "Avoid overly salesy tone", "Don't ignore comments", "Avoid inconsistency", "Don't skip captions"]
        },
        "calendar": [
            {"week": 1, "day": 1, "topic": "Introduction", "format": "Reel", "caption_hook": "Here's why...", "cta": "Follow for more"},
            {"week": 1, "day": 3, "topic": "Quick Win", "format": "Carousel", "caption_hook": "Want results?", "cta": "Save this"},
            {"week": 2, "day": 2, "topic": "Educational", "format": "Post", "caption_hook": "Did you know...", "cta": "Share this"}
        ],
        "sample_posts": [
            {
                "title": "🚀 Game-Changing Strategy",
                "caption": f"If you're in {strategy_input.industry}, listen up.\n\n✅ Consistent posting\n✅ Authentic storytelling\n✅ Value-first\n\nComment 'STRATEGY' 👇",
                "hashtags": [f"#{strategy_input.industry.replace(' ', '')}", f"#{strategy_input.platform}Marketing", "#ContentStrategy"],
                "image_prompt": f"Professional workspace with {strategy_input.platform} dashboard, vibrant colors",
                "best_time": "Weekdays 9-11 AM"
            }
        ],
        "roi_prediction": {
            "traffic_lift_percentage": "18-25%",
            "engagement_boost_percentage": "35-45%",
            "estimated_monthly_reach": "5K-15K",
            "conversion_rate_estimate": "1.5-2.5%",
            "time_to_results": "30-60 days"
        }
    }

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/api/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    strategies = list(strategies_collection.find({
        "user_id": current_user["id"]
    }).sort("created_at", -1).limit(50))
    
    # Serialization fix - Frontend expects 'id' not '_id'
    for s in strategies:
        s["id"] = str(s["_id"])  # Add 'id' field for frontend
        s["_id"] = str(s["_id"])  # Keep _id as string too
        if isinstance(s.get("created_at"), datetime):
            s["created_at"] = s["created_at"].isoformat()
            
    return {
        "history": strategies or [],
        "count": len(strategies)
    }

@app.get("/api/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    # Calculate usage count from actual strategies generated THIS MONTH
    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    
    # Count strategies created this month
    monthly_usage = strategies_collection.count_documents({
        "user_id": current_user["id"],
        "created_at": {"$gte": month_start}
    })
    
    # Total all-time strategies
    total_strategies = strategies_collection.count_documents({
        "user_id": current_user["id"]
    })
    
    return {
        "email": current_user.get("email"),
        "tier": current_user.get("tier", "free"),
        "usage_count": monthly_usage,  # Monthly usage for free tier limit
        "total_strategies": total_strategies,  # All-time total
        "created_at": current_user.get("created_at"),
        "razorpay_subscription_id": current_user.get("razorpay_subscription_id")
    }

# ============================================================================
# EXPERIENCE-BASED STRATEGY GENERATOR
# ============================================================================

def generate_experience_based_strategy(input_data: dict) -> tuple[str, list]:
    """
    Generates the 'Tactical Blueprint' (HTML) and Sample Posts based on inputs.
    This serves as the deterministic/logic-based layer of the strategy.
    
    Args:
        input_data (dict): Strategy inputs (goal, audience, etc.)
        
    Returns:
        tuple: (blueprint_html_string, sample_posts_list)
    """
    
    # Re-use demo strategy logic to get structured data
    # converting dict back to StrategyInput for the existing function
    strategy_input_obj = StrategyInput(**input_data)
    base_data = generate_demo_strategy(strategy_input_obj)
    
    # Extract data for the blueprint
    guidance = base_data["strategic_guidance"]
    calendar = base_data["calendar"]
    
    # Build HTML Blueprint
    # This creates the "Tactical Blueprint" tab content in the frontend
    html = f"""
    <div class="blueprint-container">
        <div class="blueprint-section">
            <h3>🎯 30-Day Execution Plan</h3>
            <p><strong>Focus:</strong> {input_data.get('goal', 'Growth')}</p>
            <p><strong>Frequency:</strong> {guidance['when_to_post']['frequency']}</p>
        </div>
        
        <div class="blueprint-section">
            <h3>💡 Content Pillars</h3>
            <ul>
                {"".join([f"<li>{item}</li>" for item in guidance['what_to_do'][:3]])}
            </ul>
        </div>
        
        <div class="blueprint-section">
            <h3>🚀 Growth Tactics</h3>
            <ul>
                {"".join([f"<li>{item}</li>" for item in guidance['how_to_do_it'][:3]])}
            </ul>
        </div>
        
        <div class="blueprint-section">
            <h3>📈 Key Metrics</h3>
            <p>Focus on: {", ".join(guidance['what_to_focus_on'][:3])}</p>
        </div>
    </div>
    """
    
    return html, base_data["sample_posts"]


@app.post("/api/strategy")
async def generate_strategy(
    strategy_input: StrategyInput,
    current_user: dict = Depends(get_current_user)
):
    print("DEBUG: generate_strategy endpoint CALLED (Top Location)")
    # Get user tier for rate limiting
    user = users_collection.find_one({"_id": ObjectId(current_user["id"])})
    tier = user.get("tier", "free")
    
    # OpenAI-style rate limiting (BEFORE expensive LLM call)
    rate_info = check_rate_limit(current_user["id"], tier)
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
    
    # Generate strategy
    start_time = time.time()
    
    # 1. Generate the Tactical Blueprint (The detailed "how-to" manual the user loves)
    blueprint_input = strategy_input.dict()
    blueprint_input["topic"] = strategy_input.goal[:50] # Use part of goal as topic
    blueprint_html, sample_posts = generate_experience_based_strategy(blueprint_input)
    
    # 2. Generate the Agent Intelligence (Deep research)
    if CREW_AI_ENABLED:
        try:
            strategy_dict = create_content_strategy_crew(strategy_input)
            message = "Strategy generated successfully"
        except Exception as e:
            strategy_dict = generate_demo_strategy(strategy_input)
            message = f"⚠️ CrewAI error, using demo: {str(e)}"
    else:
        strategy_dict = generate_demo_strategy(strategy_input)
        message = "⚠️ DEMO MODE: Add GROQ_API_KEY to .env for AI generation"
    
    # 3. Merge both into the response
    # We add the blueprint_html to the strategy_dict so the UI can render it in a new tab
    strategy_dict["tactical_blueprint"] = blueprint_html
    strategy_dict["sample_posts"] = sample_posts
    
    generation_time = time.time() - start_time
    
    # Cache result ONLY if successful (don't cache demo fallback on error)
    if "CrewAI error" not in message:
        set_cached_strategy(cache_key, strategy_dict)
    else:
        print(f"[CACHE] Skipping cache for failed generation: {message}")
    
    # Extract the actual strategy content to avoid nesting issues
    # CrewAI returns: {strategy: {personas: [], keywords: [], ...}, personas: [], ...}
    # We only want the inner 'strategy' object
    if "strategy" in strategy_dict and isinstance(strategy_dict["strategy"], dict):
        # Use the nested strategy object as the base
        clean_strategy = strategy_dict["strategy"].copy()
        # Merge the outer fields into the inner strategy object so frontend can find them
        clean_strategy["tactical_blueprint"] = blueprint_html
        clean_strategy["sample_posts"] = sample_posts
    else:
        # Fallback to the whole dict if no nesting
        clean_strategy = strategy_dict.copy()

    # Save to MongoDB
    strategy_doc = {
        "user_id": current_user["id"],
        "goal": strategy_input.goal,
        "audience": strategy_input.audience,
        "industry": strategy_input.industry,
        "platform": strategy_input.platform,
        "output_data": clean_strategy,  # Save clean data
        "cache_key": cache_key,
        "generation_time": int(generation_time),
        "created_at": datetime.now(timezone.utc)
    }
    result = strategies_collection.insert_one(strategy_doc)
    strategy_doc["_id"] = str(result.inserted_id)
    
    # Increment usage count
    if REDIS_ENABLED:
        try:
            current_month = datetime.now().strftime("%Y-%m")
            count_key = f"strategy_count:{current_user['id']}:{current_month}"
            
            # Get current or 0
            current_val = redis_client.get(count_key)
            new_count = int(current_val) + 1 if current_val else 1
            
            # Set with 24h expiry (rolling)
            redis_client.setex(count_key, 86400, new_count)
            print(f"[USAGE] Usage incremented for {current_user['id']}: {new_count}/3")
        except Exception as e:
            print(f"[WARNING] Failed to increment usage: {e}")
    
    
    
    # Strategy content already extracted and merged above (lines 2118-2127)
    # Using 'clean_strategy' variable which contains blueprint and sample_posts
    
    
    return {
        "success": True,
        "strategy": clean_strategy,  # Wrap in 'strategy' key for frontend compatibility
        "cached": False,
        "generation_time": generation_time,
        "message": message,
        "usage": rate_info,
        "tier": tier
    }

@app.get("/")
async def root():
    return {
        "message": "AgentForge API - Premium AI Strategy Platform",
        "version": "2.0.0",
        "database": "MongoDB",
        "cache": "Redis" if REDIS_ENABLED else "Disabled",
        "ai": "CrewAI Elite" if CREW_AI_ENABLED else "Demo Mode"
    }

@app.get("/api/health")
async def health_check():
    try:
        mongo_client.admin.command('ping')
        db_status = "healthy"
    except:
        db_status = "unhealthy"
    
    return {
        "status": "operational",
        "database": db_status,
        "redis": "healthy" if REDIS_ENABLED else "disabled",
        "crewai": "enabled" if CREW_AI_ENABLED else "demo mode",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/api/auth/signup", response_model=Token)
async def signup(user_data: UserCreate):
    if users_collection.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": user_data.email,
        "hashed_password": get_password_hash(user_data.password),
        "tier": "free",
        "created_at": datetime.now(timezone.utc)
    }
    
    result = users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(data={"sub": user_id})
    return Token(access_token=access_token, user_id=user_id, email=user_data.email)

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = users_collection.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    user_id = str(user["_id"])
    access_token = create_access_token(data={"sub": user_id})
    return Token(access_token=access_token, user_id=user_id, email=user["email"])

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "tier": current_user.get("tier", "free"),
        "created_at": current_user.get("created_at")
    }

@app.get("/api/history/{strategy_id}")
async def get_strategy(strategy_id: str, current_user: dict = Depends(get_current_user)):
    # Verify valid ObjectId
    if not ObjectId.is_valid(strategy_id):
        raise HTTPException(status_code=400, detail="Invalid strategy ID")
        
    # Find strategy
    strategy = strategies_collection.find_one({
        "_id": ObjectId(strategy_id),
        "user_id": current_user["id"]
    })
    
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
        
    # Serialize ID and Dates - Frontend expects 'id' not '_id'
    strategy["id"] = str(strategy["_id"])  # Add 'id' field for frontend
    strategy["_id"] = str(strategy["_id"])
    if isinstance(strategy.get("created_at"), datetime):
        strategy["created_at"] = strategy["created_at"].isoformat()
        
    return strategy

@app.delete("/api/history/{strategy_id}")
async def delete_strategy(strategy_id: str, current_user: dict = Depends(get_current_user)):
    # Verify valid ObjectId
    if not ObjectId.is_valid(strategy_id):
        raise HTTPException(status_code=400, detail="Invalid strategy ID")
        
    # Attempt delete (must ensure user owns the strategy)
    result = strategies_collection.delete_one({
        "_id": ObjectId(strategy_id),
        "user_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Strategy not found or unauthorized")
        
    return {"message": "Strategy deleted successfully"}

@app.post("/api/strategies/{strategy_id}/blueprint")
async def generate_tactical_blueprint(strategy_id: str, current_user: dict = Depends(get_current_user)):
    """
    Generate tactical blueprint from existing strategy
    Extracts objectives, tactics, timeline, and KPIs
    """
    # Verify valid ObjectId
    if not ObjectId.is_valid(strategy_id):
        raise HTTPException(status_code=400, detail="Invalid strategy ID")
    
    # Find strategy
    strategy = strategies_collection.find_one({
        "_id": ObjectId(strategy_id),
        "user_id": current_user["id"]
    })
    
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    # Extract tactical data from strategy
    # Support both "output_data" (new format) and "strategy" (legacy format)
    strategy_data = strategy.get("output_data") or strategy.get("strategy") or {}
    strategic_guidance = strategy_data.get("strategic_guidance", {})
    
    # Build blueprint
    blueprint = {
        "objectives": strategic_guidance.get("what_to_do", []),
        "tactics": strategic_guidance.get("how_to_do_it", []),
        "timeline": f"Frequency: {strategic_guidance.get('when_to_post', {}).get('frequency', 'Not specified')}",
        "kpis": strategic_guidance.get("what_to_focus_on", [])
    }
    
    # Add ROI predictions if available
    roi = strategy_data.get("roi_prediction", {})
    if roi:
        blueprint["timeline"] += f" | Expected Results: {roi.get('time_to_results', 'N/A')}"
        blueprint["kpis"].extend([
            f"Traffic Lift: {roi.get('traffic_lift_percentage', 'N/A')}",
            f"Engagement Boost: {roi.get('engagement_boost_percentage', 'N/A')}",
            f"Monthly Reach: {roi.get('estimated_monthly_reach', 'N/A')}"
        ])
    
    return {
        "success": True,
        "blueprint": blueprint,
        "strategy_id": strategy_id
    }


# ============================================================================
# RAZORPAY CHECKOUT (Pro Tier)
# ============================================================================

@app.post("/api/pro-checkout")
async def create_checkout_session(request: Request, current_user: dict = Depends(get_current_user)):
    """Create Razorpay subscription for Pro tier (₹2,400/mo)"""
    if not RAZORPAY_ENABLED:
        raise HTTPException(status_code=503, detail="Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env")
    
    try:
        # Create Razorpay subscription
        subscription = razorpay_client.subscription.create({
            'plan_id': RAZORPAY_PLAN_ID,
            'customer_notify': 1,
            'quantity': 1,
            'total_count': 12,  # 12 months
            'notes': {
                'user_id': current_user["id"],
                'email': current_user["email"]
            }
        })
        
        return {
            "subscription_id": subscription['id'],
            "razorpay_key": RAZORPAY_KEY_ID
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ADMIN PANEL ENDPOINTS (SEPARATE AUTHENTICATION)
# ============================================================================

@app.get("/api/admin/dashboard")
async def admin_dashboard(admin: bool = Depends(admin_auth)):
    """
    Admin Dashboard - Live MRR tracking and system health
    Requires admin secret key (NOT user JWT)
    """
    try:
        # Calculate MRR and user metrics
        pro_users = users_collection.count_documents({"tier": "pro"})
        total_users = users_collection.count_documents({})
        mrr = pro_users * 499  # ₹499 per Pro user
        
        # Calculate conversion rate
        conversion_rate = (pro_users / total_users * 100) if total_users > 0 else 0
        
        # Get today's strategy count
        now = datetime.now(timezone.utc)
        start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
        strategies_today = strategies_collection.count_documents({
            "created_at": {"$gte": start_of_day}
        })
        
        # Total strategies
        total_strategies = strategies_collection.count_documents({})
        
        # System health checks
        redis_healthy = False
        try:
            if REDIS_ENABLED:
                redis_client.ping()
                redis_healthy = True
        except:
            pass
        
        return {
            "revenue": {
                "mrr": f"₹{mrr:,}",
                "mrr_raw": mrr,
                "pro_users": pro_users,
                "conversion_rate": f"{conversion_rate:.1f}%"
            },
            "usage": {
                "total_strategies": total_strategies,
                "strategies_today": strategies_today,
                "active_users": total_users
            },
            "system": {
                "mongodb_healthy": True,  # If we got here, MongoDB is working
                "redis_healthy": redis_healthy,
                "crew_ai_enabled": CREW_AI_ENABLED,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")


@app.get("/api/admin/users")
async def admin_users(
    search: Optional[str] = Query(None),
    tier: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    admin: bool = Depends(admin_auth)
):
    """
    Admin Users List - Enhanced with search and filtering
    Requires admin secret key (NOT user JWT)
    """
    try:
        # Build query
        query = {}
        if search:
            query["email"] = {"$regex": search, "$options": "i"}
        if tier:
            query["tier"] = tier
        
        # Get users with strategy counts
        users = list(users_collection.aggregate([
            {"$match": query},
            {
                "$lookup": {
                    "from": "strategies",
                    "localField": "_id",
                    "foreignField": "user_id",
                    "as": "strategies"
                }
            },
            {
                "$project": {
                    "email": 1,
                    "tier": 1,
                    "created_at": 1,
                    "razorpay_subscription_id": 1,
                    "strategies_count": {"$size": "$strategies"}
                }
            },
            {"$sort": {"created_at": -1}},
            {"$limit": limit}
        ]))
        
        # Convert ObjectId to string for JSON serialization
        for user in users:
            user["_id"] = str(user["_id"])
            user["created_at"] = user.get("created_at", datetime.now(timezone.utc)).isoformat()
        
        # Calculate totals
        total = users_collection.count_documents(query)
        pro_users = users_collection.count_documents({**query, "tier": "pro"})
        
        return {
            "users": users,
            "count": len(users),
            "total": total,
            "pro_users": pro_users,
            "conversion_rate": f"{(pro_users/total*100):.1f}%" if total > 0 else "0%"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Users list error: {str(e)}")

@app.get("/api/admin/revenue-breakdown")
async def revenue_breakdown(admin: bool = Depends(admin_auth)):
    """
    Admin: Revenue breakdown by industry (Heatmap data)
    """
    try:
        # Industries generating MRR
        industries = list(users_collection.aggregate([
            {"$match": {"tier": "pro"}},
            {"$group": {
                "_id": "$industry", 
                "count": {"$sum": 1},
                "first_seen": {"$min": "$created_at"}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]))
        
        return {"industries": industries}
    except Exception as e:
        # Return empty list on error to prevent dashboard crash
        print(f"Revenue breakdown error: {e}")
        return {"industries": []}

@app.get("/api/admin/activity")
async def admin_activity(limit: int = 20, admin: bool = Depends(admin_auth)):
    """
    Admin: Live activity feed from analytics/strategies
    """
    try:
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        
        # Get recent strategies as activity
        activities = list(strategies_collection.aggregate([
            {"$match": {"created_at": {"$gte": yesterday}}},
            {"$sort": {"created_at": -1}},
            {"$limit": limit},
            {"$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "_id",
                "as": "user"
            }},
            {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
            {"$project": {
                "action": {"$literal": "Generated strategy"},
                "user_email": "$user.email",
                "timestamp": "$created_at",
                "details": "$industry"
            }}
        ]))
        
        # Format for frontend
        formatted_activities = []
        for a in activities:
            formatted_activities.append({
                "user": a.get("user_email", "Unknown User"),
                "action": a.get("action"),
                "time": a.get("timestamp").strftime("%H:%M:%S") if a.get("timestamp") else "Just now",
                "details": a.get("details")
            })
            
        return {"activities": formatted_activities}
    except Exception as e:
        print(f"Activity feed error: {e}")
        return {"activities": []}

@app.get("/api/admin/alerts")
async def admin_alerts(admin: bool = Depends(admin_auth)):
    """
    Admin: System alerts and business intelligence
    """
    try:
        pro_users = users_collection.count_documents({"tier": "pro"})
        total_users = users_collection.count_documents({})
        conversion = (pro_users / total_users * 100) if total_users else 0
        
        alerts = []
        
        # Conversion Alert
        if conversion < 4.5:
            alerts.append({
                "type": "warning",
                "title": "Low Conversion Rate",
                "message": f"{conversion:.1f}% < 4.5% goal. Optimize modal.",
                "priority": "high",
                "impact": "₹15,000/mo potential loss"
            })
            
        # System Health Alerts
        if not REDIS_ENABLED:
             alerts.append({
                "type": "error",
                "title": "Redis Disabled",
                "message": "Caching is disabled. High latency expected.",
                "priority": "critical",
                "impact": "High Server Load"
            })
            
        return {"alerts": alerts}
    except Exception as e:
        return {"alerts": []}



# =============================================================================
# USAGE TRACKING (OpenAI-style live counter)
# =============================================================================

@app.get("/api/user/usage")
async def get_usage(current_user: dict = Depends(get_current_user)):
    """Get current usage for live counter - updates every 30s"""
    try:
        user = users_collection.find_one({"_id": ObjectId(current_user["id"])})
        tier = user.get("tier", "free")
        
        if tier == "pro":
            return {
                "used": 0,
                "limit": "unlimited",
                "tier": "pro",
                "reset_in": "N/A"
            }
        
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(hours=WINDOW_HOURS)
        
        # Count strategies in current window
        used = strategies_collection.count_documents({
            "user_id": current_user["id"],
            "created_at": {"$gte": window_start}
        })
        
        # Calculate reset time
        if used > 0:
            oldest = strategies_collection.find_one(
                {"user_id": current_user["id"], "created_at": {"$gte": window_start}},
                sort=[("created_at", 1)]
            )
            if oldest:
                reset_time = oldest["created_at"] + timedelta(hours=WINDOW_HOURS)
                diff = (reset_time - now).total_seconds()
                reset_h = int(diff // 3600)
                reset_m = int((diff % 3600) // 60)
                reset_in = f"{reset_h}h {reset_m}m"
            else:
                reset_in = f"{WINDOW_HOURS}h 0m"
        else:
            reset_in = f"{WINDOW_HOURS}h 0m"
        
        return {
            "used": used,
            "limit": FREE_LIMIT,
            "reset_in": reset_in,
            "progress": round((used / FREE_LIMIT) * 100, 1),
            "tier": "free"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Usage error: {str(e)}")


@app.get("/api/admin/rate-limits")
async def admin_rate_limits(admin: bool = Depends(admin_auth)):
    """Admin analytics for rate limiting conversion tracking"""
    try:
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        
        # Count users who hit limit in last 24h
        pipeline = [
            {"$match": {"created_at": {"$gte": yesterday}}},
            {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
            {"$match": {"count": {"$gte": FREE_LIMIT}}}
        ]
        limits_hit = len(list(strategies_collection.aggregate(pipeline)))
        
        # Calculate potential revenue (4.7% conversion)
        conversion_rate = 0.047
        potential_conversions = round(limits_hit * conversion_rate)
        potential_revenue = potential_conversions * 499
        
        return {
            "daily_limits_hit": limits_hit,
            "conversion_rate": "4.7%",
            "potential_revenue": f"₹{potential_revenue:,.0f}",
            "estimated_conversions": potential_conversions,
            "limit_config": {
                "free_limit": FREE_LIMIT,
                "window_hours": WINDOW_HOURS
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rate limits analytics error: {str(e)}")


# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    print("Starting AgentForge API Server...")
    print(f"Admin Panel: Use secret key '{ADMIN_SECRET}' to access /api/admin/*")
    uvicorn.run(app, host="0.0.0.0", port=8000)


# ============================================================================
@app.delete("/api/history/{strategy_id}")
async def delete_strategy(strategy_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a specific strategy and reset usage count"""
    try:
        result = strategies_collection.delete_one({
            "_id": ObjectId(strategy_id),
            "user_id": current_user["id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Strategy not found or unauthorized")
            
        # Optional: Reset rate limit counter on delete to be user-friendly
        if REDIS_ENABLED:
            try:
                current_month = datetime.now().strftime("%Y-%m")
                count_key = f"strategy_count:{current_user['id']}:{current_month}"
                redis_client.delete(count_key)
                print(f"♻️  Usage reset for {current_user['id']} after deletion")
            except Exception as e:
                print(f"⚠️ Failed to reset usage: {e}")
        return {"success": True, "message": "Strategy deleted and usage reset"}
        
    except Exception as e:
        print(f"❌ Delete error: {e}")
        raise HTTPException(status_code=404, detail="Strategy not found")

# ============================================================================
# HISTORY ENDPOINTS (Order matters! General routes before parameterized ones)
# ============================================================================


@app.get("/api/history/{strategy_id}")
async def get_strategy_by_id(strategy_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific strategy by ID"""
    try:
        # Fetch the strategy (only if it belongs to this user)
        strategy = strategies_collection.find_one({
            "_id": ObjectId(strategy_id),
            "user_id": current_user["id"]
        })
        
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        # Format response - CRITICAL: Include output_data which has the tactical_blueprint
        return {
            "id": str(strategy["_id"]),
            "topic": strategy.get("topic", strategy.get("goal", "Untitled Strategy")),
            "goal": strategy.get("goal"),
            "audience": strategy.get("audience"),
            "industry": strategy.get("industry"),
            "platform": strategy.get("platform"),
            "experience": strategy.get("experience", "beginner"),
            "output_data": strategy.get("output_data", {}),
            "created_at": strategy.get("created_at").isoformat() if strategy.get("created_at") else None,
            "generation_time": strategy.get("generation_time", "Unknown"),
            "feedback": strategy.get("feedback")
        }
        
    except Exception as e:
        print(f"❌ Get strategy error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



def generate_experience_based_strategy(data: dict) -> str:
    """Route to appropriate strategy based on experience level"""
    experience = data.get("experience", "beginner").lower()
    topic = data.get("topic", "Business")
    goal = data.get("goal", "")
    audience = data.get("audience", "")
    industry = data.get("industry", "General")
    platform = data.get("platform", "Instagram")
    content_type = data.get("contentType", "Reels")
    
    if experience == "beginner":
        return generate_beginner_strategy(topic, goal, audience, industry, platform, content_type)
    elif experience == "intermediate":
        return generate_intermediate_strategy(topic, goal, audience, industry, platform, content_type)
    elif experience == "expert":
        return generate_expert_strategy(topic, goal, audience, industry, platform, content_type)
    else:
        # Fallback to dummy posts for generic template
        blueprint_html = generate_strategy_template(topic)
        sample_posts = [
            {
                "type": "General Post",
                "hook": f"How to get started with {topic} today.",
                "body": "Share your best tip for beginners and common mistakes to avoid.",
                "cta": "Like and share if this helped!"
            }
        ]
        return blueprint_html, sample_posts


def generate_beginner_strategy(topic, goal, audience, industry, platform, content_type):
    """Beginner: Copy-paste scripts + iPhone guides"""
    return f"""
<div class="strategy-sections">
    <div class="bp-badge">🎯 Beginner Mode</div>

    <h1>{topic.upper()} BLUEPRINT</h1>

    <section class="bp-section">
        <h2>1. Business Goal</h2>
        <p><strong>Primary Objective:</strong> {goal or f'Grow {topic} presence on {platform}'}</p>
        <p><strong>90-Day Target:</strong> 10,000 engaged followers and 200 qualified leads through consistent {content_type}.</p>
    </section>

    <section class="bp-section">
        <h2>2. Target Audience</h2>
        <p><strong>Who they are:</strong> {audience or 'Aspiring enthusiasts in your niche'}</p>
        <p><strong>Key Pain Point:</strong> Overwhelmed by complex tech and looking for simple, actionable advice.</p>
    </section>

    <section class="bp-section">
        <h2>3. The Content Formula</h2>
        <p><strong>Your Angle:</strong> "The Friendly Guide" — Documenting the journey, not just the destination.</p>
        <ul class="bp-check-list">
            <li>Keep videos under 30 seconds</li>
            <li>Use natural lighting (iPhone only)</li>
            <li>Add captions with high contrast</li>
        </ul>
    </section>

    <section class="bp-section">
        <h2>4. Beginner "Copy-Paste" Script</h2>
        <ul class="bp-step-list">
            <li><strong>Hook (0-3s):</strong> "I used to struggle with {topic} until I found this..."</li>
            <li><strong>Value (3-12s):</strong> [Show one simple trick or behind-the-scenes clip]</li>
            <li><strong>CTA (12-15s):</strong> "Comment 'HELP' if you want the PDF guide!"</li>
        </ul>
    </section>

    <section class="bp-section">
        <h2>5. 30-Day Growth Roadmap</h2>
        <div class="bp-table-container">
            <table>
                <thead>
                    <tr><th>Phase</th><th>Followers</th><th>Action</th></tr>
                </thead>
                <tbody>
                    <tr><td>Week 1-2</td><td>100-500</td><td>Post 3x weekly, engage daily</td></tr>
                    <tr><td>Week 3-4</td><td>500-1,500</td><td>Analyze top post, create similar</td></tr>
                    <tr><td>Month 2</td><td>1,500-5,000</td><td>Collaborate with similar accounts</td></tr>
                </tbody>
            </table>
        </div>
    </section>

    <section class="bp-section">
        <h2>6. Common Pitfalls</h2>
        <ul class="bp-avoid-list">
            <li>Buying followers (kills engagement)</li>
            <li>Posting without a caption</li>
            <li>Giving up before 90 days</li>
        </ul>
    </section>
</div>
"""
    
    sample_posts = [
        {
            "type": "Reel / Video",
            "hook": f"The one thing nobody tells you about {topic}...",
            "body": "Show a quick 5-second clip of you working or a 'before' vs 'after' result.",
            "cta": "Read the caption for my secret!"
        },
        {
            "type": "Educational",
            "hook": f"3 simple steps to master {topic} for {audience}.",
            "body": "Step 1: Focus on quality. Step 2: Use the right tools. Step 3: Be consistent.",
            "cta": f"Follow for more {topic} tips!"
        }
    ]
    
    return blueprint_html, sample_posts




def generate_intermediate_strategy(topic, goal, audience, industry, platform, content_type):
    """Intermediate: Canva workflows + efficiency"""
    return f"""
<div class="strategy-sections">
    <div class="bp-badge">⚡ Intermediate Mode</div>

    <h1>{topic.upper()} EFFICIENCY GUIDE</h1>

    <section class="bp-section">
        <h2>1. Business Goal</h2>
        <p><strong>Primary Objective:</strong> {goal or f'Scale {topic} to 50K followers'}</p>
        <p><strong>90-Day Target:</strong> 50,000 engaged followers and 1,000 qualified leads through optimized content workflows.</p>
    </section>

    <section class="bp-section">
        <h2>2. Target Audience & Positioning</h2>
        <p><strong>Primary Audience:</strong> {audience or 'Professionals seeking efficiency'}</p>
        <p><strong>Brand Angle:</strong> The Efficient Expert — High quality visuals meets smart automation.</p>
        <p><strong>Pillar Framework:</strong> 40% Educational, 30% Case Studies, 20% Tools, 10% Personal.</p>
    </section>

<section class="strategy-section" style="background: #DBEAFE; padding: 1.5rem; border-radius: 1rem;">
<h2 style="color: #1E40AF;">5. EXECUTION PLAN (CANVA WORKFLOWS)</h2>

<h3 style="color: #7C3AED; margin-top: 1rem;">🎨 CANVA TEMPLATE SYSTEM</h3>
<div style="background: white; padding: 1rem; border-radius: 0.5rem; margin-top: 0.5rem;">
<p><strong>Create 3 Master Templates:</strong></p>

<p style="margin-top: 1rem;"><strong>Template 1: Hook Overlay</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Yellow text with black outline (high contrast)</li>
<li>Font: Montserrat Bold, 72pt</li>
<li>Position: Top third of screen</li>
<li>Animation: Fade in (0.5s)</li>
</ul>

<p style="margin-top: 1rem;"><strong>Template 2: CTA Sticker</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Design: "DM 'START' NOW" + Arrow pointing right</li>
<li>Colors: Brand colors (purple/pink gradient)</li>
<li>Size: 300x150px</li>
<li>Position: Bottom right corner</li>
</ul>

<p style="margin-top: 1rem;"><strong>Template 3: Progress Bar</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Before/After split screen design</li>
<li>Progress indicator (0% → 100%)</li>
<li>Timestamp overlays</li>
</ul>
</div>

<h3 style="color: #7C3AED; margin-top: 1.5rem;">⚙️ BATCH CREATION WORKFLOW</h3>
<div style="background: white; padding: 1rem; border-radius: 0.5rem; margin-top: 0.5rem;">
<p><strong>Monday (2 hours) - Content Day:</strong></p>
<ol style="margin-left: 1.5rem;">
<li><strong>Film (30 min):</strong> Record 5 raw videos back-to-back</li>
<li><strong>Canva (45 min):</strong> Add graphics to all 5 videos
  <ul style="margin-left: 1rem;">
    <li>Import video to Canva</li>
    <li>Apply master template</li>
    <li>Customize text (5 min per video)</li>
    <li>Export as MP4</li>
  </ul>
</li>
<li><strong>CapCut (30 min):</strong> Add audio + transitions
  <ul style="margin-left: 1rem;">
    <li>Import from Canva</li>
    <li>Add trending audio</li>
    <li>Speed adjustments (1.1x-1.3x)</li>
    <li>Smooth transitions</li>
  </ul>
</li>
<li><strong>Schedule (15 min):</strong> Upload to Later/Planoly for the week</li>
</ol>

<p style="margin-top: 1rem;"><strong>Result:</strong> 5 professional Reels in 2 hours = 15 min per Reel</p>
</div>

<h3 style="color: #7C3AED; margin-top: 1.5rem;">📊 CONTENT CALENDAR (Copy This)</h3>
<div style="background: white; padding: 1rem; border-radius: 0.5rem; margin-top: 0.5rem;">
<table style="width: 100%; border-collapse: collapse;">
<tr style="background: #F3F4F6;">
<th style="border: 1px solid #E5E7EB; padding: 0.5rem;">Day</th>
<th style="border: 1px solid #E5E7EB; padding: 0.5rem;">Content Type</th>
<th style="border: 1px solid #E5E7EB; padding: 0.5rem;">Canva Template</th>
</tr>
<tr>
<td style="border: 1px solid #E5E7EB; padding: 0.5rem;">Mon 8AM</td>
<td style="border: 1px solid #E5E7EB; padding: 0.5rem;">Educational</td>
<td style="border: 1px solid #E5E7EB; padding: 0.5rem;">Hook Overlay</td>
</tr>
<tr style="background: #F9FAFB;">
<td style="border: 1px solid #E5E7EB; padding: 0.5rem;">Wed 1PM</td>
<td style="border: 1px solid #E5E7EB; padding: 0.5rem;">Case Study</td>
<td style="border: 1px solid #E5E7EB; padding: 0.5rem;">Progress Bar</td>
</tr>
<tr>
<td style="border: 1px solid #E5E7EB; padding: 0.5rem;">Fri 7PM</td>
<td style="border: 1px solid #E5E7EB; padding: 0.5rem;">Tool/Resource</td>
<td style="border: 1px solid #E5E7EB; padding: 0.5rem;">CTA Sticker</td>
</tr>
</table>
</div>
</section>

<section class="strategy-section">
<h2>6. OPTIMIZATION STRATEGY</h2>
<p><strong>Weekly Review (30 min every Sunday):</strong></p>
<ol style="margin-left: 1.5rem;">
<li>Check Instagram Insights for top 3 performing Reels</li>
<li>Identify common elements (hook, topic, format)</li>
<li>Create 2 variations of winning formula for next week</li>
<li>Archive or delete bottom 20% performers</li>
</ol>
</section>

<section class="strategy-section">
<h2>7. TOOLS STACK</h2>
<div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem;">
<p><strong>Essential Tools:</strong></p>
<ul style="margin-left: 1.5rem;">
<li><strong>Canva Pro:</strong> $12.99/mo - Templates + brand kit</li>
<li><strong>CapCut:</strong> Free - Video editing</li>
<li><strong>Later:</strong> $18/mo - Scheduling</li>
<li><strong>Notion:</strong> Free - Content calendar</li>
</ul>
<p style="margin-top: 0.5rem;"><strong>Total Cost:</strong> ~$31/month for professional workflow</p>
</div>
</section>

<section class="strategy-section">
<h2>8. GROWTH METRICS</h2>
<p><strong>Track Weekly:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Follower growth rate (%)</li>
<li>Engagement rate (likes + comments + saves / followers)</li>
<li>Best performing content type</li>
<li>Optimal posting times</li>
</ul>
<p><strong>Goal:</strong> 5-10% engagement rate, 1000+ followers/week by Month 2</p>
</section>

<section class="strategy-section">
<h2>9. COLLABORATION STRATEGY</h2>
<p><strong>Month 2-3: Partner with 5-10 accounts</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Similar follower count (±20%)</li>
<li>Same niche, non-competing</li>
<li>Cross-promote each other's content</li>
<li>Joint Lives or challenges</li>
</ul>
</section>

<section class="strategy-section">
<h2>10. 90-DAY ROADMAP</h2>
<div style="background: #DBEAFE; padding: 1rem; border-radius: 0.5rem;">
<p><strong>Month 1:</strong> Build workflow, post 5x/week, reach 5K followers</p>
<p><strong>Month 2:</strong> Optimize top performers, collaborate, reach 20K followers</p>
<p><strong>Month 3:</strong> Scale with ads ($200-500), launch offer, reach 50K followers</p>
</div>
</section>

<section class="strategy-section" style="background: #FEF3C7; padding: 1.5rem; border-radius: 1rem;">
<h2 style="color: #92400E;">⚠️ INTERMEDIATE REALITY CHECK</h2>
<p style="color: #065F46;"><strong>✅ This works if:</strong> You batch create, track metrics, and optimize weekly</p>
<p style="color: #991B1B; margin-top: 0.5rem;"><strong>❌ This fails if:</strong> You create content daily without analyzing performance</p>
</section>

</div>
"""
    
    sample_posts = [
        {
            "type": "Batch Reel",
            "hook": f"Why most {audience} are failing at {topic} in 2024...",
            "body": "Talking head with fast-paced B-roll of your automated system or workflow.",
            "cta": "Check my link for the free automation toolkit!"
        },
        {
            "type": "Carousel",
            "hook": f"My $0 to $10k {topic} Blueprint",
            "body": "Show screenshots of results + step-by-step roadmap.",
            "cta": "Tag a friend who needs to scale!"
        }
    ]
    
    return blueprint_html, sample_posts


def generate_expert_strategy(topic, goal, audience, industry, platform, content_type):
    """Expert: Viral frameworks + A/B testing"""
    return f"""
<div class="strategy-sections">
    <div class="bp-badge">🚀 Expert Mode</div>

    <h1>{topic.upper()} AUTHORITY PLAN</h1>

    <section class="bp-section">
        <h2>1. Business Goal & Audience</h2>
        <p><strong>Core Objective:</strong> {goal or f'Dominate {industry} on {platform}'}</p>
        <p><strong>Psychographic:</strong> {audience or 'High-intent buyers looking for authority.'}</p>
        <p><strong>Target ROI:</strong> 100,000+ followers and $50K revenue in 90 days.</p>
    </section>

<h3 style="color: #8B5CF6; margin-top: 1rem;">🎯 HOOK FORMULAS (3 Proven Frameworks)</h3>
    <section class="bp-section">
        <h2>2. Expert Frameworks</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-white/50 dark:bg-gray-800/30">
                <h3>Problem-Agitate-Solve</h3>
                <ul class="bp-step-list">
                    <li><strong>Hook:</strong> "I wasted 2 years on..."</li>
                    <li><strong>Agitate:</strong> "Lost $10K and hours..."</li>
                    <li><strong>Solve:</strong> "Until I found [Method]"</li>
                </ul>
            </div>
            <div class="p-4 rounded-2xl bg-white/50 dark:bg-gray-800/30">
                <h3>The Contrarian Take</h3>
                <ul class="bp-step-list">
                    <li><strong>Hook:</strong> "{industry} gurus are lying"</li>
                    <li><strong>Expose:</strong> "They say X, but Y is true"</li>
                    <li><strong>CTA:</strong> "Save this before it's deleted"</li>
                </ul>
            </div>
        </div>
    </section>

    <section class="bp-section">
        <h2>3. Hashtag Clusters (KD &lt; 25)</h2>
        <div class="p-4 rounded-2xl bg-white/50 dark:bg-gray-800/30 font-mono text-sm leading-relaxed">
            <p class="text-primary-600 mb-2"><strong>Mega (100K-1M):</strong> #{industry}tips #{platform}marketing #viral{content_type}</p>
            <p class="text-secondary-600 mb-2"><strong>Medium (10K-100K):</strong> #{industry}strategy #{topic.replace(' ', '')}growth #contentmarketing</p>
            <p class="text-gray-500"><strong>Niche (1K-10K):</strong> #{industry}2024 #{topic.replace(' ', '')}tips #{platform}algorithm</p>
        </div>
    </section>

    <section class="bp-section">
        <h2>4. A/B Testing Matrix</h2>
        <div class="bp-table-container">
            <table>
                <thead>
                    <tr><th>Week</th><th>Test Variable</th><th>Winner Action</th></tr>
                </thead>
                <tbody>
                    <tr><td>W1</td><td>Hook Type</td><td>Scale winning hook 3x</td></tr>
                    <tr><td>W2</td><td>Posting Time</td><td>Lock in optimal slot</td></tr>
                    <tr><td>W3</td><td>CTA Type</td><td>Replicate top conversion</td></tr>
                </tbody>
            </table>
        </div>
    </section>

<h3 style="color: #8B5CF6; margin-top: 1.5rem;">5. CONVERSION FUNNEL</h3>
<div style="background: white; padding: 1rem; border-radius: 0.5rem; margin-top: 0.5rem;">
<p><strong>Stage 1: Awareness (Viral Content)</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Hook-driven Reels (10M+ reach target)</li>
<li>Controversial takes (high engagement)</li>
<li>CTA: "Follow for daily tips"</li>
</ul>

<p style="margin-top: 1rem;"><strong>Stage 2: Consideration (Authority Content)</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Case studies with metrics</li>
<li>Behind-the-scenes of results</li>
<li>CTA: "DM 'STRATEGY' for free guide"</li>
</ul>

<p style="margin-top: 1rem;"><strong>Stage 3: Conversion (Direct Offer)</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Limited-time offers</li>
<li>Testimonial compilations</li>
<li>CTA: "Link in bio - 24hr only"</li>
</ul>
</div>
</section>

<section class="strategy-section">
<h2>6. ANALYTICS DASHBOARD</h2>
<p><strong>Track Daily (Non-Negotiable):</strong></p>
<ul style="margin-left: 1.5rem;">
<li><strong>Engagement Rate:</strong> Target >15% (likes+comments+saves/followers)</li>
<li><strong>Reach Rate:</strong> Target >50% (reach/followers)</li>
<li><strong>Save Rate:</strong> Target >5% (saves/reach) - Highest signal</li>
<li><strong>Share Rate:</strong> Target >2% (shares/reach) - Viral indicator</li>
<li><strong>Profile Visit Rate:</strong> Target >10% (visits/reach)</li>
<li><strong>Follower Conversion:</strong> Target >3% (new followers/profile visits)</li>
</ul>

<p style="margin-top: 1rem;"><strong>Tools:</strong> Instagram Insights + Metricool + Google Sheets automation</p>
</section>

<section class="strategy-section">
<h2>7. PAID AMPLIFICATION</h2>
<p><strong>Month 2-3: $1,000-2,000 Ad Budget</strong></p>
<div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem; margin-top: 0.5rem;">
<p><strong>Strategy:</strong></p>
<ol style="margin-left: 1.5rem;">
<li>Identify top 3 organic performers (>20% engagement)</li>
<li>Boost with $50-100 each</li>
<li>Target: Lookalike audience (1% of followers)</li>
<li>Objective: Reach + Engagement</li>
<li>Scale winners to $500+</li>
</ol>
<p style="margin-top: 0.5rem;"><strong>Expected ROI:</strong> $1 ad spend = 50-100 new followers (if content is proven)</p>
</div>
</section>

<section class="strategy-section">
<h2>8. INFLUENCER COLLABORATION</h2>
<p><strong>Target: 10-20 micro-influencers (10K-100K followers)</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Engagement rate >10%</li>
<li>Audience overlap >30%</li>
<li>Collaboration: Shoutout-for-shoutout or paid ($100-500)</li>
<li>Expected: 500-2000 new followers per collab</li>
</ul>
</section>

<section class="strategy-section">
<h2>9. CONTENT REPURPOSING</h2>
<p><strong>1 Viral Reel → 10 Content Pieces:</strong></p>
<ol style="margin-left: 1.5rem;">
<li>Original Reel on Instagram</li>
<li>Repost on TikTok</li>
<li>YouTube Shorts</li>
<li>LinkedIn carousel (screenshots)</li>
<li>Twitter thread</li>
<li>Email newsletter</li>
<li>Blog post (expanded)</li>
<li>Pinterest pin</li>
<li>Facebook post</li>
<li>Instagram Story highlights</li>
</ol>
</section>

<section class="strategy-section">
<h2>10. 90-DAY REVENUE ROADMAP</h2>
<div style="background: #F3E8FF; padding: 1rem; border-radius: 0.5rem;">
<p><strong>Month 1: Build + Test</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Post 7x/week, A/B test hooks</li>
<li>Goal: 10K followers, identify winning formula</li>
<li>Revenue: $0 (building audience)</li>
</ul>

<p style="margin-top: 1rem;"><strong>Month 2: Scale + Monetize</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Double down on winners, start ads ($500)</li>
<li>Launch digital product ($47-97)</li>
<li>Goal: 50K followers, $5K revenue</li>
</ul>

<p style="margin-top: 1rem;"><strong>Month 3: Optimize + Expand</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Scale ads ($1500), influencer collabs</li>
<li>Launch high-ticket offer ($497-997)</li>
<li>Goal: 100K followers, $50K revenue</li>
</ul>
</div>
</section>

<section class="strategy-section" style="background: #FEF3C7; padding: 1.5rem; border-radius: 1rem;">
<h2 style="color: #92400E;">⚠️ EXPERT REALITY CHECK</h2>
<p style="color: #065F46;"><strong>✅ This works if:</strong> You're data-obsessed, test relentlessly, and scale winners aggressively</p>
<p style="color: #991B1B; margin-top: 0.5rem;"><strong>❌ This fails if:</strong> You rely on "gut feel" instead of metrics, or give up before finding your viral formula</p>

<div style="margin-top: 1rem; background: white; padding: 1rem; border-radius: 0.5rem;">
<p style="font-weight: bold; color: #8B5CF6;">💡 EXPERT TIP:</p>
<p>Your first viral hit is luck. Your second is skill. Your third is a system. Build the system.</p>
</div>
</section>

</section>

</div>
"""
    
    sample_posts = [
        {
            "type": "Thought Leadership",
            "hook": f"The {industry} industry is lying to you about {topic}.",
            "body": "Challenge a common myth with data-backed counter-points. Use a contrarian approach to build authority.",
            "cta": "Join my masterclass for the full breakdown."
        },
        {
            "type": "Case Study",
            "hook": f"How we helped a client achieve their {topic} goals in 28 days.",
            "body": "Highlight the specific 'Amethyst' framework applied and the ROI achieved. Show real data and results.",
            "cta": "Apply for a 1:1 strategy audit today."
        }
    ]
    
    return blueprint_html, sample_posts

def generate_strategy_template(topic: str) -> str:
    """Generate 10-section strategy matching coffee format exactly"""
    # ... (Existing template function remains below)
    return f"""
<div class="strategy-sections">

<h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 2rem; color: #7C3AED;">
CONTENT STRATEGY FOR {topic.upper()}
</h1>

<section class="strategy-section">
<h2 style="font-size: 1.75rem; font-weight: bold; margin: 2rem 0 1rem; color: #1E3A8A;">
1. BUSINESS GOAL (Refined)
</h2>
<p><strong>Vague Goal:</strong> "Grow {topic} presence"</p>
<p><strong>SMART Goal:</strong> Generate 50,000 engaged followers and 500 qualified leads in 90 days through educational content and strategic offers.</p>
</section>

<section class="strategy-section">
<h2 style="font-size: 1.75rem; font-weight: bold; margin: 2rem 0 1rem; color: #1E3A8A;">
2. TARGET AUDIENCE (Narrowed Down)
</h2>
<p><strong>Primary Audience (70% focus):</strong> Health-conscious professionals aged 25-40</p>
<ul style="margin-left: 1.5rem; margin-top: 0.5rem;">
<li>Active on Instagram 2-3 hours daily</li>
<li>Values convenience and quality</li>
<li>Willing to pay premium for results</li>
<li>Seeks expert guidance and community</li>
<li>Prefers visual, bite-sized content</li>
</ul>
<p><strong>Secondary Audience:</strong> Fitness enthusiasts and wellness advocates</p>
<p><strong>Recommendation:</strong> Focus 70% on primary audience for maximum conversion</p>
</section>

<section class="strategy-section">
<h2 style="font-size: 1.75rem; font-weight: bold; margin: 2rem 0 1rem; color: #1E3A8A;">
3. BRAND POSITIONING & UNIQUE ANGLE
</h2>
<p><strong>Positioning Options:</strong></p>
<ol style="margin-left: 1.5rem; margin-top: 0.5rem;">
<li><strong>The Expert:</strong> Science-backed, data-driven approach</li>
<li><strong>The Relatable Friend:</strong> Real results, real people</li>
<li><strong>The Premium Choice:</strong> Luxury experience, exclusive access</li>
<li><strong>The Community Builder:</strong> Supportive tribe, shared journey</li>
<li><strong>The Innovator:</strong> Cutting-edge methods, latest trends</li>
</ol>
<p><strong>Recommended:</strong> #2 - The Relatable Friend. Authenticity drives engagement and trust.</p>
</section>

<section class="strategy-section">
<h2 style="font-size: 1.75rem; font-weight: bold; margin: 2rem 0 1rem; color: #1E3A8A;">
4. CONTENT PILLARS (What You'll Actually Post)
</h2>

<div style="margin-top: 1rem;">
<h3 style="font-size: 1.25rem; font-weight: 600; color: #7C3AED;">Pillar 1: Educational/Value (30%)</h3>
<p><strong>5 Reel Examples:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>"5 Signs You Need This" - Problem awareness</li>
<li>"Common Mistakes to Avoid" - Expert tips</li>
<li>"How It Works in 60 Seconds" - Quick explainer</li>
<li>"Before You Start, Know This" - Prerequisites</li>
<li>"The Science Behind Results" - Credibility builder</li>
</ul>
</div>

<div style="margin-top: 1.5rem;">
<h3 style="font-size: 1.25rem; font-weight: 600; color: #7C3AED;">Pillar 2: Product/Offer (25%)</h3>
<p><strong>5 Reel Examples:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>"What's Included" - Feature showcase</li>
<li>"Real Results in 30 Days" - Testimonials</li>
<li>"Limited Time Offer" - Urgency creator</li>
<li>"How to Get Started" - CTA focused</li>
<li>"Why Choose Us" - Differentiation</li>
</ul>
</div>

<div style="margin-top: 1.5rem;">
<h3 style="font-size: 1.25rem; font-weight: 600; color: #7C3AED;">Pillar 3: Lifestyle/Relatable (30%)</h3>
<p><strong>5 Reel Examples:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>"Day in the Life" - Behind the scenes</li>
<li>"Relatable Struggles" - Humor + empathy</li>
<li>"Morning Routine" - Aspirational content</li>
<li>"Weekend Vibes" - Lifestyle integration</li>
<li>"Real Talk" - Authentic moments</li>
</ul>
</div>

<div style="margin-top: 1.5rem;">
<h3 style="font-size: 1.25rem; font-weight: 600; color: #7C3AED;">Pillar 4: Community/UGC (15%)</h3>
<p><strong>5 Reel Examples:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>"Customer Spotlight" - Success stories</li>
<li>"Q&A Friday" - Engagement driver</li>
<li>"Challenge Results" - Community wins</li>
<li>"Your Questions Answered" - Interactive</li>
<li>"Shoutout Saturday" - Recognition</li>
</ul>
</div>
</section>

<section class="strategy-section">
<h2 style="font-size: 1.75rem; font-weight: bold; margin: 2rem 0 1rem; color: #1E3A8A;">
5. CONTENT EXECUTION PLAN
</h2>
<p><strong>Posting Frequency:</strong> 5-7 Reels per week (1-2 daily)</p>
<p><strong>Best Posting Times:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>7-9 AM (Morning commute)</li>
<li>12-1 PM (Lunch break)</li>
<li>7-9 PM (Evening wind-down)</li>
</ul>
<p><strong>Reel Format:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Hook: First 3 seconds grab attention</li>
<li>Length: 15-30 seconds optimal</li>
<li>CTA: Clear next step (link in bio, comment, share)</li>
</ul>

<table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
<thead>
<tr style="background: #F3F4F6;">
<th style="border: 1px solid #E5E7EB; padding: 0.75rem;">Week</th>
<th style="border: 1px solid #E5E7EB; padding: 0.75rem;">Educational</th>
<th style="border: 1px solid #E5E7EB; padding: 0.75rem;">Product</th>
<th style="border: 1px solid #E5E7EB; padding: 0.75rem;">Lifestyle</th>
<th style="border: 1px solid #E5E7EB; padding: 0.75rem;">Community</th>
</tr>
</thead>
<tbody>
<tr>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">Week 1</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">2 posts</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">1 post</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">2 posts</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">1 post</td>
</tr>
<tr style="background: #F9FAFB;">
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">Week 2</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">2 posts</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">2 posts</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">2 posts</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">1 post</td>
</tr>
<tr>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">Week 3</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">2 posts</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">1 post</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">2 posts</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">1 post</td>
</tr>
<tr style="background: #F9FAFB;">
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">Week 4</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">2 posts</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">2 posts</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">2 posts</td>
<td style="border: 1px solid #E5E7EB; padding: 0.75rem;">1 post</td>
</tr>
</tbody>
</table>
</section>

<section class="strategy-section">
<h2 style="font-size: 1.75rem; font-weight: bold; margin: 2rem 0 1rem; color: #1E3A8A;">
6. CONVERSION STRATEGY
</h2>
<p><strong>Link in Bio:</strong> Linktree with 4 options</p>
<ul style="margin-left: 1.5rem;">
<li>Free Guide Download (lead magnet)</li>
<li>Book Consultation (high-intent)</li>
<li>Shop Products (direct sale)</li>
<li>Join Community (engagement)</li>
</ul>
<p><strong>Stories Integration:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Polls: "Which topic next?"</li>
<li>Countdowns: Launch announcements</li>
<li>Quizzes: "What's your type?"</li>
<li>Questions: Direct engagement</li>
</ul>
<p><strong>Instagram Offers:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>"Show this Reel for 15% off"</li>
<li>"Comment 'READY' for exclusive access"</li>
<li>"First 50 get bonus package"</li>
</ul>
</section>

<section class="strategy-section">
<h2 style="font-size: 1.75rem; font-weight: bold; margin: 2rem 0 1rem; color: #1E3A8A;">
7. HASHTAG STRATEGY
</h2>
<p><strong>Large (100k-1M followers):</strong></p>
<ul style="margin-left: 1.5rem;">
<li>#FitnessMotivation (1.2M)</li>
<li>#HealthyLifestyle (850K)</li>
<li>#WellnessJourney (600K)</li>
<li>#TransformationTuesday (500K)</li>
</ul>
<p><strong>Medium (10k-100k):</strong></p>
<ul style="margin-left: 1.5rem;">
<li>#FitnessCommunity (85K)</li>
<li>#HealthCoach (45K)</li>
<li>#WellnessWarrior (30K)</li>
<li>#MindBodySoul (25K)</li>
</ul>
<p><strong>Small/Niche (1k-10k):</strong></p>
<ul style="margin-left: 1.5rem;">
<li>#YourNiche2024 (5K)</li>
<li>#LocalFitness (3K)</li>
<li>#SpecificMethod (2K)</li>
<li>#CommunityName (1K)</li>
</ul>
<p><strong>Usage:</strong> 8-12 hashtags per post, mix all three sizes</p>
</section>

<section class="strategy-section">
<h2 style="font-size: 1.75rem; font-weight: bold; margin: 2rem 0 1rem; color: #1E3A8A;">
8. METRICS TO TRACK
</h2>
<p><strong>Weekly Metrics:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Follower growth rate</li>
<li>Engagement rate (likes + comments + saves)</li>
<li>Reach and impressions</li>
<li>Profile visits</li>
<li>Link clicks</li>
</ul>
<p><strong>Monthly Metrics:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Lead generation (email signups)</li>
<li>Conversion rate (leads to customers)</li>
<li>Revenue from Instagram</li>
<li>Top performing content types</li>
</ul>
<p><strong>Goal Benchmarks:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Month 1: 5,000 followers, 5% engagement</li>
<li>Month 2: 15,000 followers, 7% engagement</li>
<li>Month 3: 50,000 followers, 10% engagement</li>
<li>90 days: 500 qualified leads</li>
</ul>
</section>

<section class="strategy-section">
<h2 style="font-size: 1.75rem; font-weight: bold; margin: 2rem 0 1rem; color: #1E3A8A;">
9. CONTENT CREATION TIPS
</h2>
<p><strong>Equipment:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>iPhone/Android (no fancy camera needed)</li>
<li>Natural lighting (near windows)</li>
<li>Simple tripod ($20-30)</li>
<li>Wireless mic for audio ($50)</li>
</ul>
<p><strong>Editing Tools:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>CapCut (free, easy transitions)</li>
<li>InShot (text overlays)</li>
<li>Canva (thumbnails, graphics)</li>
</ul>
<p><strong>Batch Creation Workflow:</strong></p>
<ol style="margin-left: 1.5rem;">
<li>Film 10-15 Reels in one session</li>
<li>Edit in batches (2-3 hours)</li>
<li>Schedule with Later or Planoly</li>
<li>Engage daily (30 min morning + evening)</li>
</ol>
<p><strong>Competitor Spy Method:</strong></p>
<ul style="margin-left: 1.5rem;">
<li>Follow top 10 competitors</li>
<li>Save their best-performing Reels</li>
<li>Adapt (don't copy) their hooks and formats</li>
<li>Add your unique angle</li>
</ul>
</section>

<section class="strategy-section">
<h2 style="font-size: 1.75rem; font-weight: bold; margin: 2rem 0 1rem; color: #1E3A8A;">
10. 90-DAY ROADMAP
</h2>
<div style="margin-top: 1rem;">
<h3 style="font-size: 1.25rem; font-weight: 600; color: #7C3AED;">Month 1: Foundation</h3>
<ul style="margin-left: 1.5rem;">
<li>Set up profile optimization (bio, highlights, link)</li>
<li>Create first 30 Reels (batch filming)</li>
<li>Post 5-7x per week consistently</li>
<li>Engage 30 min daily (comments, DMs)</li>
<li>Goal: 5,000 followers, establish brand voice</li>
</ul>
</div>

<div style="margin-top: 1.5rem;">
<h3 style="font-size: 1.25rem; font-weight: 600; color: #7C3AED;">Month 2: Optimization</h3>
<ul style="margin-left: 1.5rem;">
<li>Analyze top 10 performing Reels</li>
<li>Double down on winning formats</li>
<li>Launch first paid offer/product</li>
<li>Run Instagram Stories ads ($200-500)</li>
<li>Goal: 15,000 followers, 100 leads</li>
</ul>
</div>

<div style="margin-top: 1.5rem;">
<h3 style="font-size: 1.25rem; font-weight: 600; color: #7C3AED;">Month 3: Scale</h3>
<ul style="margin-left: 1.5rem;">
<li>Collaborate with 5-10 micro-influencers</li>
<li>Launch UGC campaign (customer testimonials)</li>
<li>Increase ad spend to $1,000-2,000</li>
<li>Host live Q&A or workshop</li>
<li>Goal: 50,000 followers, 500 qualified leads</li>
</ul>
</div>
</section>

<section class="strategy-section" style="background: #FEF3C7; padding: 1.5rem; border-radius: 1rem; border-left: 4px solid #F59E0B;">
<h2 style="font-size: 1.75rem; font-weight: bold; margin-bottom: 1rem; color: #92400E;">
⚠️ FINAL REALITY CHECK
</h2>
<div style="margin-top: 1rem;">
<p style="font-weight: 600; color: #065F46; margin-bottom: 0.5rem;">✅ This works if:</p>
<ul style="margin-left: 1.5rem; color: #065F46;">
<li>You post consistently (5-7x per week minimum)</li>
<li>You engage authentically (not just auto-comments)</li>
<li>You track metrics weekly and adjust</li>
<li>You batch create content (don't wing it daily)</li>
<li>You have a clear offer/product to sell</li>
</ul>
</div>

<div style="margin-top: 1.5rem;">
<p style="font-weight: 600; color: #991B1B; margin-bottom: 0.5rem;">❌ This fails if:</p>
<ul style="margin-left: 1.5rem; color: #991B1B;">
<li>You post sporadically (2-3x per week)</li>
<li>You only promote, never provide value</li>
<li>You ignore comments and DMs</li>
<li>You don't analyze what's working</li>
<li>You give up before 90 days</li>
</ul>
</div>
</section>

</div>
"""


def generate_coffee_format_strategy(topic: str) -> str:
    """Generate strategy using CrewAI agents (if enabled)"""
    # This would use CrewAI to generate content
    # For now, fall back to template
    return generate_strategy_template(topic)


# ============================================================================
# STRATEGY GENERATION
# ============================================================================


# Endpoint moved to line 530 to fix registration issues





# ============================================================================
# HISTORY ENDPOINTS
# ============================================================================

@app.get("/api/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    """Get user's strategy generation history"""
    try:
        # Fetch all strategies for the current user, sorted by most recent first
        strategies = list(strategies_collection.find(
            {"user_id": current_user["id"]},
            {
                "_id": 1,
                "goal": 1,
                "audience": 1,
                "industry": 1,
                "platform": 1,
                "created_at": 1,
                "generation_time": 1
            }
        ).sort("created_at", -1))
        
        # Convert ObjectId to string for JSON serialization
        for strategy in strategies:
            strategy["id"] = str(strategy["_id"])
            del strategy["_id"]
        
        return {
            "success": True,
            "history": strategies,
            "total": len(strategies)
        }
    except Exception as e:
        print(f"❌ Error fetching history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history/{strategy_id}")
async def get_strategy_by_id(
    strategy_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific strategy by ID"""
    try:
        strategy = strategies_collection.find_one({
            "_id": ObjectId(strategy_id),
            "user_id": current_user["id"]
        })
        
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        # Convert ObjectId to string
        strategy["id"] = str(strategy["_id"])
        del strategy["_id"]
        
        return {
            "success": True,
            **strategy  # Spread the strategy data directly
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching strategy {strategy_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/history/{strategy_id}")
async def delete_strategy(
    strategy_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a strategy by ID"""
    try:
        result = strategies_collection.delete_one({
            "_id": ObjectId(strategy_id),
            "user_id": current_user["id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        return {
            "success": True,
            "message": "Strategy deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting strategy {strategy_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# RAZORPAY WEBHOOK - Automatic Pro Tier Upgrade
# ============================================================================

@app.post("/api/razorpay/webhook")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhook events for subscription management"""
    if not RAZORPAY_ENABLED:
        raise HTTPException(status_code=503, detail="Razorpay not configured")
    
    payload = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")
    
    # Verify webhook signature
    try:
        razorpay_client.utility.verify_webhook_signature(
            payload.decode(), 
            signature, 
            RAZORPAY_WEBHOOK_SECRET
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Parse event
    import json
    event = json.loads(payload)
    
    # Handle subscription.activated
    if event['event'] == 'subscription.activated':
        notes = event['payload']['subscription']['entity']['notes']
        user_id = notes.get('user_id')
        
        if user_id:
            # Upgrade user to Pro tier
            users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "tier": "pro",
                    "razorpay_subscription_id": event['payload']['subscription']['entity']['id']
                }}
            )
            print(f"✅ User {user_id} upgraded to Pro via Razorpay")
    
    # Handle subscription.cancelled
    elif event['event'] == 'subscription.cancelled':
        notes = event['payload']['subscription']['entity']['notes']
        user_id = notes.get('user_id')
        
        if user_id:
            # Downgrade user to free tier
            users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"tier": "free"}}
            )
            print(f"⚠️ User {user_id} downgraded to Free (subscription cancelled)")
    
    return {"status": "success"}


# ============================================================================
# REFERRAL SYSTEM - Viral Growth ($5K/mo potential)
# ============================================================================

class ReferralCodeInput(BaseModel):
    referral_code: str = Field(..., min_length=6, max_length=10)

@app.post("/api/referral/apply")
async def apply_referral(
    referral_input: ReferralCodeInput,
    current_user: dict = Depends(get_current_user)
):
    """
    Apply referral code - Gives referring user 7 days free Pro
    Viral loop: User shares code → Friend signs up → Both get benefits
    """
    
    # Check if referral code exists
    referrer = users_collection.find_one({"referral_code": referral_input.referral_code})
    
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # Can't refer yourself
    if str(referrer["_id"]) == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot use your own referral code")
    
    # Check if already used a referral
    current_user_doc = users_collection.find_one({"_id": ObjectId(current_user["id"])})
    if current_user_doc.get("referred_by"):
        raise HTTPException(status_code=400, detail="Referral code already applied")
    
    # REWARD REFERRER: 7 days free Pro
    users_collection.update_one(
        {"_id": referrer["_id"]},
        {
            "$set": {
                "tier": "pro",
                "pro_until": datetime.now(timezone.utc) + timedelta(days=7),
                "updated_at": datetime.now(timezone.utc)
            },
            "$inc": {"referral_count": 1}
        }
    )
    
    # Mark new user as referred
    users_collection.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {
            "referred_by": str(referrer["_id"]),
            "referred_at": datetime.now(timezone.utc)
        }}
    )
    
    return {
        "success": True,
        "message": f"🎉 Referral applied! You and {referrer.get('email', 'the referrer')} both get bonuses!"
    }


@app.get("/api/referral/code")
async def get_referral_code(current_user: dict = Depends(get_current_user)):
    """
    Get user's unique referral code (generate if doesn't exist)
    """
    user_doc = users_collection.find_one({"_id": ObjectId(current_user["id"])})
    
    # Generate referral code if doesn't exist
    if not user_doc.get("referral_code"):
        import secrets
        referral_code = secrets.token_urlsafe(6).upper().replace("-", "").replace("_", "")[:8]
        
        users_collection.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": {"referral_code": referral_code}}
        )
    else:
        referral_code = user_doc["referral_code"]
    
    referral_count = user_doc.get("referral_count", 0)
    
    return {
        "referral_code": referral_code,
        "referral_count": referral_count,
        "share_url": f"https://stratify.ai/signup?ref={referral_code}",
        "message": "Share this link to earn free Pro access!"
    }


# ============================================================================
# PROFILE ENDPOINTS
# ============================================================================

@app.get("/api/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile information including usage stats"""
    user_id = current_user["id"]
    
    # Count total strategies
    total_strategies = strategies_collection.count_documents({"user_id": user_id})
    
    # Count strategies for this month (calendar month)
    today = datetime.now(timezone.utc)
    # Start of current month
    start_of_month = datetime(today.year, today.month, 1, tzinfo=timezone.utc)
    
    # Count strategies created this month
    # We use a flexible query to handle potential timezone issues or naive datetimes
    usage_month = strategies_collection.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": start_of_month}
    })
    
    return {
        "name": current_user.get("name", current_user["email"].split("@")[0]),
        "email": current_user["email"],
        "tier": current_user.get("tier", "free"),
        "usage_month": usage_month,
        "total_strategies": total_strategies,
        "photo": current_user.get("photo", None)
    }

@app.put("/api/profile")
async def update_profile(data: dict, current_user: dict = Depends(get_current_user)):
    """Update user profile information"""
    update_fields = {}
    if "name" in data:
        update_fields["name"] = data["name"]
    if "photo" in data:
        update_fields["photo"] = data["photo"]
    
    if not update_fields:
        return {"success": False, "message": "No fields to update"}
        
    users_collection.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_fields}
    )
    
    return {"success": True, "message": "Profile updated successfully"}


# ============================================================================
# FEEDBACK ENDPOINT (VenturusAI Response)
# ============================================================================

@app.post("/feedback")
async def submit_feedback(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Submit feedback (thumbs up/down) on a strategy"""
    try:
        # Verify token
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get feedback data
        data = await request.json()
        strategy_id = data.get("strategy_id")
        rating = data.get("rating")  # "up" or "down"
        comment = data.get("comment", "")
        
        # Update strategy with feedback
        strategies_collection.update_one(
            {"_id": ObjectId(strategy_id), "user_id": user_id},
            {
                "$set": {
                    "feedback_rating": rating,
                    "feedback_comment": comment,
                    "feedback_date": datetime.now(timezone.utc)
                }
            }
        )
        
        return {
            "success": True,
            "message": "Feedback submitted successfully"
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"❌ Feedback error: {e}")
        raise HTTPException(status_code=500, detail=str(e))




if __name__ == "__main__":
    import uvicorn
    print("Starting AgentForge API...")
    # reload=False to avoid Python 3.13 multiprocessing issues
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
