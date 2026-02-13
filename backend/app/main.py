from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.routers import auth, strategy, health

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"])

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Content Strategy Platform | 5 Elite Agents | ROI Predictions | SEO Keywords | Production SaaS",
    version=settings.VERSION
)

# Startup Logging
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.main")

@app.on_event("startup")
async def startup_event():
    logger.info("================================================================")
    logger.info(f"🚀 {settings.PROJECT_NAME} Backend v{settings.VERSION}")
    logger.info("================================================================")
    
    # CrewAI Status
    if settings.GROQ_API_KEY:
        logger.info(f"✅  CrewAI Status: ENABLED (API Key found: {settings.GROQ_API_KEY[:4]}***)")
    else:
        logger.warning("⚠️  CrewAI Status: DISABLED (Missing GROQ_API_KEY)")
        logger.warning("    -> App will use DEMO MODE for strategy generation.")

    # Admin Key Status
    if settings.ADMIN_SECRET and settings.ADMIN_SECRET != "agentforge-admin-2026-change-now":
        logger.info("🔒  Admin Security: CONFIGURED")
    elif settings.ADMIN_SECRET:
         logger.warning("⚠️  Admin Security: USING DEFAULT SECRET (Please change in production)")
    else:
        logger.error("❌  Admin Security: MISSING ADMIN_SECRET")
        
    logger.info("================================================================")

# Add rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Validation Error Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(strategy.router)
app.include_router(health.router)

@app.get("/")
async def root():
    return {
        "message": f"{settings.PROJECT_NAME} API - Premium AI Strategy Platform",
        "version": settings.VERSION,
        "docs": "/docs"
    }
