"""
System Health Service — MongoDB, Redis, CPU, Memory, Uptime
"""
import time
import psutil
from datetime import datetime, timezone
from app.core.mongo import mongo_client
from app.core.redis import redis_client
import logging

logger = logging.getLogger(__name__)

_start_time = time.time()


class HealthService:

    async def get_health(self) -> dict:
        now = datetime.now(timezone.utc)
        
        # ── MongoDB ─────────────────────────────────────────
        mongo_status = "healthy"
        mongo_latency_ms = None
        try:
            t0 = time.perf_counter()
            mongo_client.admin.command("ping")
            mongo_latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        except Exception as e:
            mongo_status = "error"
            logger.error(f"MongoDB health check failed: {e}")

        # ── Redis ────────────────────────────────────────────
        redis_status = "disabled"
        redis_latency_ms = None
        if redis_client.enabled:
            try:
                t0 = time.perf_counter()
                pong = redis_client.ping()
                redis_latency_ms = round((time.perf_counter() - t0) * 1000, 2)
                redis_status = "healthy" if pong else "error"
            except Exception as e:
                redis_status = "error"
                logger.error(f"Redis health check failed: {e}")

        # ── CPU / Memory ─────────────────────────────────────
        try:
            cpu_usage = psutil.cpu_percent(interval=0.1)
            mem = psutil.virtual_memory()
            memory_usage = round(mem.percent, 1)
            memory_used_mb = round(mem.used / 1024 / 1024, 1)
            memory_total_mb = round(mem.total / 1024 / 1024, 1)
        except Exception:
            cpu_usage = 0.0
            memory_usage = 0.0
            memory_used_mb = 0
            memory_total_mb = 0

        # ── Uptime ───────────────────────────────────────────
        uptime_seconds = int(time.time() - _start_time)
        hours, remainder = divmod(uptime_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        uptime_str = f"{hours}h {minutes}m {seconds}s"

        # ── Overall status ────────────────────────────────────
        if mongo_status == "error":
            overall = "degraded"
        elif redis_status == "error":
            overall = "degraded"
        else:
            overall = "operational"

        return {
            "mongo": mongo_status,
            "mongo_latency_ms": mongo_latency_ms,
            "redis": redis_status,
            "redis_latency_ms": redis_latency_ms,
            "agents": "running",
            "uptime": uptime_str,
            "uptime_seconds": uptime_seconds,
            "cpu_usage": cpu_usage,
            "memory_usage": memory_usage,
            "memory_used_mb": memory_used_mb,
            "memory_total_mb": memory_total_mb,
            "overall": overall,
            "last_updated": now.isoformat(),
        }


health_service = HealthService()
