# Frontend — Planvix React Application

Premium React + Vite SPA with glassmorphism design, Recharts analytics, animated KPI cards, WebSocket live feed, and a full Enterprise Admin Intelligence Dashboard.

---

## 🎨 Design System

- **Glassmorphism**: `bg-slate-900/60 backdrop-blur-xl border border-slate-800/50` cards throughout admin
- **Dark Theme**: Deep navy (`#020817`) base for admin, animated gradient for user app
- **Micro-animations**: Tab fades, hover lifts, CountUp number animations
- **Color Palette**: Emerald (revenue), Blue (users), Violet (AI/enterprise), Amber (ARPU), Rose (churn/danger)
- **Typography**: Inter from Google Fonts, tabular-nums for financial data

---

## 📦 File Structure

```
frontend/src/
├── context/
│   ├── AdminAuthContext.jsx   # Admin JWT state, adminAxios instance, auto-logout on 401
│   └── AuthContext.jsx        # User auth context (via useAuth hook)
├── services/
│   ├── AnalyticsService.js    # GET /api/admin/analytics, /users, /logs, CSV export
│   ├── HealthService.js       # GET /api/admin/health
│   └── WebSocketService.js    # WS lifecycle, exponential-backoff reconnect, ping/pong
├── components/
│   ├── charts/
│   │   ├── RevenueAndUserCharts.jsx  # AreaChart (revenue + user growth)
│   │   └── PieAndBarCharts.jsx       # Donut (tier), HBar (industry), Bar (AI tokens)
│   ├── kpi/
│   │   └── KPICard.jsx               # CountUp + sparkline + growth badge + skeleton
│   ├── Dashboard.jsx
│   ├── History.jsx
│   ├── Navbar.jsx
│   ├── Login.jsx
│   ├── Signup.jsx
│   └── ErrorBoundary.jsx
├── pages/
│   ├── AdminDashboard.jsx     # 6-tab enterprise admin panel (complete rebuild)
│   ├── AdminLogin.jsx         # Glassmorphism login, uses AdminAuthContext
│   ├── Profile.jsx
│   ├── Upgrade.jsx
│   └── TacticalBlueprint.jsx
├── hooks/
│   └── useAuth.js
├── api/
│   └── adminApi.js
├── App.jsx                    # Routing, AdminAuthProvider wrapping, AuthContext
├── index.css                  # Tailwind + custom animations + admin utilities
└── main.jsx
```

---

## 🛡️ Admin Intelligence Dashboard

Access at `http://localhost:5173/admin-login`

### Authentication Flow

1. Enter `ADMIN_SECRET` from backend `.env`
2. Backend issues JWT with `role: admin` claim (8h)
3. `AdminAuthContext` stores token in `localStorage` as `admin_token`
4. `adminAxios` automatically attaches `Authorization: Bearer <token>` to all requests
5. 401 response → auto-logout

### 6 Dashboard Tabs

| Tab                 | Components Used                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| **Overview**        | 8× `KPICard`, `RevenueLineChart`, `UserGrowthAreaChart`, `TierDistributionPieChart`, `IndustryBarChart` |
| **Users**           | Paginated table, search, tier filter, `TierBadge`, CSV download                                         |
| **Revenue**         | Revenue KPIs, charts, per-tier ₹ breakdown                                                              |
| **AI Intelligence** | Token KPIs, `AITokenTrendChart`, insights cards                                                         |
| **Live Activity**   | WebSocket event feed, notification bell, admin logs                                                     |
| **System Health**   | `HealthCard` for MongoDB/Redis/CPU/Memory/Uptime                                                        |

### WebSocket Service

- Auto-reconnect with exponential backoff (2s → 30s max)
- Ping/pong keepalive every 25 seconds
- Receives last 20 events on connect (history from `admin_logs`)

---

## 📊 Charts (Recharts)

| Component                  | Chart Type                   | Data Source                       |
| -------------------------- | ---------------------------- | --------------------------------- |
| `RevenueLineChart`         | AreaChart with gradient fill | `analytics.revenue_trend`         |
| `UserGrowthAreaChart`      | AreaChart with gradient fill | `analytics.user_growth`           |
| `TierDistributionPieChart` | Donut PieChart               | `analytics.tier_distribution`     |
| `IndustryBarChart`         | Horizontal BarChart          | `analytics.industry_breakdown`    |
| `AITokenTrendChart`        | Vertical BarChart            | `analytics.ai_usage.daily_tokens` |

---

## 🧩 KPI Card

```jsx
<KPICard
  title="Monthly Recurring Revenue"
  value={4500}          // animated by react-countup
  prefix="₹"
  change={12.5}         // % growth — shows TrendingUp/Down badge
  color="emerald"       // emerald | blue | violet | amber | rose | cyan
  sparkline={[{v:10},{v:20},...]}  // mini inline chart
  loading={false}       // shows skeleton when true
  icon={<DollarSign />}
/>
```

---

## 🚀 Running Locally

```bash
cd frontend
npm install
npm run dev    # → http://localhost:5173
```

---

## 🔧 Environment & Proxy

The Vite dev server proxies `/api` and `/ws` to the backend automatically (configured in `vite.config.js`):

```js
proxy: {
  '/api': 'http://localhost:8000',
  '/ws':  { target: 'ws://localhost:8000', ws: true }
}
```

---

## 📦 Key Dependencies

| Package               | Purpose                       |
| --------------------- | ----------------------------- |
| `react` + `react-dom` | UI framework                  |
| `react-router-dom`    | Client-side routing           |
| `axios`               | HTTP client with interceptors |
| `recharts`            | Composable SVG charts         |
| `react-countup`       | Animated number counters      |
| `lucide-react`        | Icon system                   |
| `react-hot-toast`     | Toast notifications           |
| `framer-motion`       | Page/component animations     |

---

## 🎨 CSS Utilities (index.css)

```css
.animate-fadeIn      /* 0.25s tab transition */
.animate-fade-in     /* 0.3s legacy */
.animate-float       /* 3s up-down float */
.glass-card          /* Glassmorphism card */
.btn-gradient        /* Gradient action button */
.tactical-blueprint  /* Rich markdown renderer styles */
```

---

## 🐛 Troubleshooting

| Issue                           | Fix                                                            |
| ------------------------------- | -------------------------------------------------------------- |
| Admin dashboard shows blank     | Check `admin_token` in localStorage; visit `/admin-login`      |
| Charts empty                    | Generate some strategies first; data requires MongoDB records  |
| WebSocket shows "Connecting..." | Ensure backend is running, check browser console for WS errors |
| KPI cards stuck loading         | Check `/api/admin/analytics` returns 200 in Network tab        |
| 401 on admin routes             | Admin JWT expired (8h); re-login at `/admin-login`             |

---

**Frontend: React 18 + Vite + Tailwind + Recharts + WebSocket** ⚡️
