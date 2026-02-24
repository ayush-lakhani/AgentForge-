# Planvix API Guide — Postman / curl Reference

Complete API reference for the Planvix backend. All endpoints base at `http://localhost:8000`.

> [!IMPORTANT]
> **Signup and Login MUST use the `POST` method.** Using `GET` returns `405 Method Not Allowed`.

> [!TIP]
> **Two separate auth systems exist:**
>
> - **User auth**: token from `/api/auth/login` — used for `/api/strategy`, `/api/history`, etc.
> - **Admin auth**: token from `/api/admin/login` — used for ALL `/api/admin/*` endpoints.

---

## 1. User Authentication

### Signup

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/auth/signup`
- **Body (JSON):**

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

- **Response:** `{ "access_token": "eyJ...", "user_id": "...", "email": "..." }`
- **Side Effect:** Triggers `user_signup` event on the admin WebSocket feed.

### Login

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/auth/login`
- **Body (JSON):**

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

- **Response:** Same as signup. Copy `access_token` for protected requests.

### Get My Profile

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/auth/me`
- **Header:** `Authorization: Bearer <user_token>`

---

## 2. Strategy Endpoints (User — JWT Required)

**Header for all:** `Authorization: Bearer <user_token>`

### Generate Strategy

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/strategy`
- **Body (JSON):**

```json
{
  "topic": "Sustainable Fashion",
  "goal": "Increase brand awareness by 20%",
  "audience": "Eco-conscious Gen Z",
  "industry": "Fashion",
  "platform": "Instagram",
  "contentType": "Reels",
  "experience": "beginner"
}
```

- `experience`: `beginner` | `intermediate` | `expert`
- **Side Effect:** Triggers `strategy_generated` event on admin WebSocket feed.

### Get All History

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/history`

### Get Single Strategy

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/history/{{strategy_id}}`

### Delete Strategy

- **Method:** `DELETE`
- **URL:** `http://localhost:8000/api/history/{{strategy_id}}`
- **Note:** Does NOT restore monthly usage count (intentional SaaS logic).
- **Side Effect:** Triggers `strategy_deleted` event on admin WebSocket feed.

---

## 3. System (Public)

### API Health Check

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/health`

### Root Info

- **Method:** `GET`
- **URL:** `http://localhost:8000/`

### Swagger Docs

- Open `http://localhost:8000/docs` in your browser for interactive API testing.

---

## 4. Admin Endpoints (Admin JWT Required)

> [!IMPORTANT]
> All `/api/admin/*` routes require `Authorization: Bearer <admin_token>` where the token has `role: admin` claim.
> Obtain the token from `/api/admin/login` using your `ADMIN_SECRET`.

### Admin Login

- **Method:** `POST`
- **URL:** `http://localhost:8000/api/admin/login`
- **Body (JSON):**

```json
{
  "secret": "your_ADMIN_SECRET_from_env"
}
```

- **Response:** `{ "access_token": "eyJ...", "token_type": "bearer" }`
- Token is valid for **8 hours**.

---

**Header for all admin requests:** `Authorization: Bearer <admin_token>`

### Full Analytics (KPIs + Charts)

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/admin/analytics`
- **Returns:** MRR, ARPU, churn rate, user counts, revenue trend (30d), user growth (30d), tier distribution, industry breakdown, AI usage/tokens

### System Health

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/admin/health`
- **Returns:** MongoDB ping + latency, Redis ping + latency, CPU usage, memory usage, uptime string

### Users (Paginated)

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/admin/users`
- **Query Params:**
  - `search=` — filter by email or name
  - `tier=` — `free` | `pro` | `enterprise` | `all`
  - `page=1` — page number
  - `limit=20` — results per page (max 100)
  - `sort_by=created_at` — sort field
  - `sort_dir=-1` — `-1` desc, `1` asc

### Export Users CSV

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/admin/users/export`
- **Response:** `text/csv` file download (all users up to 10,000)

### Admin Logs

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/admin/logs?limit=100`
- **Returns:** Persistent action log from `admin_logs` MongoDB collection

### Activity Feed (REST Fallback)

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/admin/activity`

### Revenue Breakdown

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/admin/revenue-breakdown`

### Legacy Dashboard Stats

- **Method:** `GET`
- **URL:** `http://localhost:8000/api/admin/dashboard`

---

## 5. WebSocket — Admin Activity Feed

Connect to the real-time event stream:

```
ws://localhost:8000/ws/admin/activity
```

**Behavior:**

- Sends last 20 events from `admin_logs` immediately on connect
- Pushes live events as JSON:

```json
{
  "type": "user_signup",
  "timestamp": "2026-02-24T10:30:00Z",
  "time": "10:30:00",
  "details": "New user registered: user@example.com",
  "email": "user@example.com",
  "user_id": "abc123"
}
```

**Event types:** `user_signup` | `strategy_generated` | `strategy_deleted` | `admin_login` | `payment_received`

**Keepalive:** Send `"ping"` text — server responds `{"type":"pong"}`

---

## 6. Common Errors

| Code  | Meaning                   | Fix                                |
| ----- | ------------------------- | ---------------------------------- |
| `401` | Invalid/expired token     | Re-login and refresh token         |
| `403` | Admin access required     | Use admin token, not user token    |
| `422` | Request validation failed | Check Body JSON matches schema     |
| `429` | Rate limit exceeded       | Wait 1 minute (30 req/min default) |
| `500` | Server error              | Check backend terminal logs        |
