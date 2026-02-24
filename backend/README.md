# Backend — Planvix API Server

FastAPI backend with CrewAI multi-agent orchestration, MongoDB storage, Redis caching, WebSocket activity feed, and an enterprise admin intelligence API.

---

## 🏗️ Architecture

### File Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py         # All settings via pydantic-settings
│   │   ├── mongo.py          # MongoDB client + collection refs
│   │   └── security.py       # JWT create/verify, get_current_user, get_current_admin
│   ├── models/
│   │   └── schemas.py        # Pydantic request/response models
│   ├── routers/
│   │   ├── auth.py           # /api/auth/signup, /api/auth/login — broadcasts WS on signup
│   │   ├── strategy.py       # /api/strategy, /api/history — broadcasts WS on generate/delete
│   │   ├── admin.py          # /api/admin/* — all endpoints JWT-protected (role:admin)
│   │   └── health.py         # /api/health — public health check
│   ├── services/
│   │   ├── analytics_service.py  # MongoDB aggregation engine (MRR, ARPU, churn, trends)
│   │   ├── health_service.py     # psutil CPU/memory + MongoDB/Redis ping
│   │   └── strategy_service.py   # CrewAI strategy generation
│   ├── websocket/
│   │   ├── __init__.py
│   │   └── activity_socket.py    # WS connection manager + broadcast_event() + admin_logs
│   └── main.py               # FastAPI app, CORS, rate limiting, router registration
├── run.py                    # Entry point: uvicorn with hot-reload
└── requirements.txt
```

---

## 📋 API Endpoints

### Authentication — Public

```
POST /api/auth/signup        { email, password } → { access_token, user_id, email }
POST /api/auth/login         { email, password } → { access_token, user_id, email }
GET  /api/auth/me            → { id, email, tier, usage_count, created_at }
```

### Strategies — JWT Protected (`Authorization: Bearer <user_token>`)

```
POST   /api/strategy              Generate strategy (CrewAI / Demo mode)
GET    /api/history               All strategies for current user
GET    /api/history/{id}          Single strategy by ID
DELETE /api/history/{id}          Delete strategy (does NOT restore usage count)
GET    /api/profile               User profile + usage info
```

### System — Public

```
GET /api/health               Basic health check
GET /                         API info + version
GET /docs                     Swagger UI
```

### Admin — JWT Protected (`Authorization: Bearer <admin_token>`, `role:admin` required)

```
POST /api/admin/login                 { secret } → admin JWT (8h)
GET  /api/admin/analytics             Full KPI payload (MongoDB aggregations)
GET  /api/admin/health                MongoDB/Redis latency + CPU/memory/uptime
GET  /api/admin/users                 Paginated users (search, tier filter, sort)
GET  /api/admin/users/export          Download CSV
GET  /api/admin/logs                  Admin action log (admin_logs collection)
GET  /api/admin/activity              REST fallback for activity feed
GET  /api/admin/dashboard             Legacy compatibility
GET  /api/admin/revenue-breakdown     Industry-grouped revenue
GET  /api/admin/alerts                System alerts
```

### WebSocket — Admin Feed

```
WS /ws/admin/activity         Real-time event stream (connect as admin)
                              — sends last 20 events on connect
                              — pong on "ping" keepalive messages
```

---

## 📊 Analytics Engine

`analytics_service.py` uses **pure MongoDB aggregations** — no hardcoded values.

| Metric             | Method                                       |
| ------------------ | -------------------------------------------- |
| MRR                | `pro_users × ₹299 + enterprise_users × ₹999` |
| ARPU               | `MRR / paid_users`                           |
| Churn Rate         | `cancelled_at >= month_start / total_users`  |
| MRR Growth         | Previous month comparison                    |
| Revenue Trend      | 30-day daily group by `created_at`           |
| User Growth        | 30-day daily group by `created_at`           |
| Tier Distribution  | `$group` on `tier` field                     |
| Industry Breakdown | `$group` on `industry` from strategies       |
| AI Token Usage     | `$sum tokens_used` from strategies           |
| Daily Tokens       | 7-day `$group` by date                       |

---

## 🔌 WebSocket Activity Feed

`websocket/activity_socket.py` implements:

- **ConnectionManager**: tracks all active WS connections
- **`broadcast_event(event_type, payload)`**: called from auth/strategy routers, persists to `admin_logs` collection, broadcasts to all connected admin clients
- **Event types**: `user_signup`, `strategy_generated`, `strategy_deleted`, `admin_login`, `payment_received`
- **On connect**: sends last 20 events from `admin_logs` for immediate history

---

## 🔐 Security

| Feature          | Detail                                      |
| ---------------- | ------------------------------------------- |
| Password hashing | Argon2 via passlib (SHA256 legacy fallback) |
| User JWTs        | `sub = user_id`, short-lived                |
| Admin JWTs       | `role = admin`, 8-hour expiry               |
| Rate limiting    | slowapi — configurable per-minute limit     |
| CORS             | Configured for frontend origin              |
| Input validation | Pydantic schemas                            |

---

## 🔧 Environment Variables

```bash
MONGODB_URL=mongodb+srv://...
GROQ_API_KEY=gsk_...
JWT_SECRET_KEY=change-this-in-production
ADMIN_SECRET=your-admin-secret
REDIS_URL=redis://localhost:6379
PROJECT_NAME=Planvix
VERSION=2.0.0
RATE_LIMIT_PER_MINUTE=30
```

---

## 🚀 Running Locally

```bash
cd backend

# Create + activate venv
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run
python run.py               # → http://localhost:8000
```

---

## 📦 Key Dependencies

| Package           | Purpose                   |
| ----------------- | ------------------------- |
| `fastapi`         | Web framework             |
| `uvicorn`         | ASGI server               |
| `crewai`          | Multi-agent orchestration |
| `pymongo`         | MongoDB driver            |
| `motor`           | Async MongoDB (optional)  |
| `redis`           | Redis cache client        |
| `python-jose`     | JWT handling              |
| `passlib[argon2]` | Password hashing          |
| `slowapi`         | Rate limiting             |
| `psutil`          | CPU/memory monitoring     |
| `websockets`      | WebSocket support         |

---

## 🐛 Troubleshooting

**MongoDB connection failed** → Check `MONGODB_URL` in `.env`

**Admin login returns 401** → Verify `ADMIN_SECRET` matches what you enter in the UI

**WebSocket not connecting** → Ensure backend is running on port 8000; check browser console

**CrewAI errors** → Backend falls back to Demo Mode automatically if `GROQ_API_KEY` is missing

**Strategy not generating** → Check `python run.py` terminal for agent logs

---

**Backend: FastAPI 0.100+ • MongoDB • Redis • WebSocket • CrewAI** 🚀
