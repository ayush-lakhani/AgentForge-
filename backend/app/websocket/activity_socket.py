"""
WebSocket Activity Feed — Real-time admin event broadcasting
Endpoint: /ws/admin/activity
"""
import json
import logging
from datetime import datetime, timezone
from typing import Any
from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from app.core.mongo import db

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WS Admin connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WS Admin disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        if not self.active_connections:
            return
        message = json.dumps(data)
        dead = []
        for conn in self.active_connections:
            try:
                await conn.send_text(message)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.disconnect(d)


manager = ConnectionManager()


async def broadcast_event(event_type: str, payload: dict):
    """
    Call this from any router to push a live event to all admin dashboards.
    event_type examples: 'user_signup', 'strategy_generated', 'strategy_deleted',
                         'payment_received', 'admin_login'
    """
    now = datetime.now(timezone.utc)
    event = {
        "type": event_type,
        "timestamp": now.isoformat(),
        "time": now.strftime("%H:%M:%S"),
        **payload
    }

    # Persist to admin_logs collection
    try:
        severity_map = {
            "admin_login": "warning",
            "strategy_deleted": "warning",
            "payment_received": "success",
            "user_signup": "info",
            "strategy_generated": "info",
        }
        db["admin_logs"].insert_one({
            "action": event_type,
            "details": payload.get("details", ""),
            "admin": payload.get("admin", "system"),
            "severity": severity_map.get(event_type, "info"),
            "timestamp": now,
            "extra": payload,
        })
    except Exception as e:
        logger.warning(f"Failed to write admin log: {e}")

    await manager.broadcast(event)


@router.websocket("/ws/admin/activity")
async def websocket_activity(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send last 20 events on connect
        try:
            recent = list(db["admin_logs"].find().sort("timestamp", -1).limit(20))
            for log in reversed(recent):
                await websocket.send_text(json.dumps({
                    "type": log.get("action", "info"),
                    "timestamp": log.get("timestamp", datetime.now(timezone.utc)).isoformat() if isinstance(log.get("timestamp"), datetime) else "",
                    "time": log.get("timestamp").strftime("%H:%M:%S") if isinstance(log.get("timestamp"), datetime) else "",
                    "details": log.get("details", ""),
                    "severity": log.get("severity", "info"),
                }))
        except Exception as e:
            logger.warning(f"Could not send history: {e}")

        # Keep connection alive — client pings us
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
