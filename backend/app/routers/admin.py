"""
Enterprise Admin Router — All admin endpoints, JWT-protected
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime, timezone
import csv
import io
import asyncio

from app.core.config import settings
from app.core.security import create_access_token
from app.dependencies.auth import RoleChecker
from app.services.analytics_service import analytics_service
from app.services.health_service import health_service

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# Admin Access Dependency
admin_only = Depends(RoleChecker(["admin", "superadmin"]))


# ============================================================================
# ADMIN LOGIN — Issues JWT with role="admin"
# ============================================================================
class AdminLoginRequest(BaseModel):
    secret: str


@router.post("/login")
async def admin_login(data: AdminLoginRequest):
    """Validate admin secret → return short-lived JWT (role=admin)."""
    if data.secret != settings.ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Invalid admin secret")

    token = create_access_token(
        data={"role": "admin"},
        expires_hours=8
    )

    # Log admin login event
    try:
        from app.websocket.activity_socket import broadcast_event
        asyncio.create_task(broadcast_event("admin_login", {
            "details": "Admin logged into dashboard",
            "severity": "warning"
        }))
    except Exception:
        pass

    return {"access_token": token, "token_type": "bearer"}


# ============================================================================
# ANALYTICS — Full MongoDB aggregation payload
# ============================================================================
@router.get("/analytics")
async def get_analytics(_ = admin_only):
    """
    Full analytics: KPIs, revenue trend, user growth, tier distribution,
    industry breakdown, AI usage — all from MongoDB aggregations.
    """
    return await analytics_service.get_analytics()


# ============================================================================
# HEALTH — System health check
# ============================================================================
@router.get("/health")
async def get_health(_ = admin_only):
    """MongoDB, Redis, CPU, memory, uptime."""
    return await health_service.get_health()


# ============================================================================
# USERS — Server-side search / filter / pagination / sort
# ============================================================================
@router.get("/users")
async def get_users(
    search: str = Query("", description="Search by email or name"),
    tier: str = Query("all", description="Filter by tier: free, pro, enterprise, all"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_dir: int = Query(-1, description="Sort direction: -1=desc, 1=asc"),
    _ = admin_only
):
    return await analytics_service.get_users(
        search=search, tier=tier, page=page,
        limit=limit, sort_by=sort_by, sort_dir=sort_dir
    )


# ============================================================================
# EXPORT CSV — Users export
# ============================================================================
@router.get("/users/export")
async def export_users_csv(_ = admin_only):
    data = await analytics_service.get_users(limit=10000)
    users = data["users"]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "id", "email", "tier", "created_at",
        "strategies_count", "usage_count"
    ])
    writer.writeheader()
    for u in users:
        writer.writerow({k: u.get(k, "") for k in writer.fieldnames})

    output.seek(0)
    filename = f"planvix_users_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ============================================================================
# ADMIN LOGS — Chronological action log
# ============================================================================
@router.get("/logs")
async def get_admin_logs(
    limit: int = Query(100, ge=1, le=500),
    _ = admin_only
):
    logs = await analytics_service.get_admin_logs(limit=limit)
    return {"logs": logs}


# ============================================================================
# ACTIVITY — REST fallback for activity feed
# ============================================================================
@router.get("/activity")
async def get_activity(_ = admin_only):
    activities = await analytics_service.get_recent_activity(limit=50)
    return {"activities": activities}
