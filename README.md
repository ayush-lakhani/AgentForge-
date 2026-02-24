<div align="center">
  <img src="frontend/public/logo.png" width="120" alt="Planvix Logo"/>
  <h1><b>🚀 Planvix</b></h1>
  <p>
    <strong>Multi-Agent AI Content Strategy OS</strong>
  </p>
  <p>
    <em>Orchestrating 5 Autonomous Agents to Build Your Entire Marketing Strategy</em>
  </p>

  <img src="https://img.shields.io/badge/Status-Production%20Ready-00D4AA?style=for-the-badge" />
  <img src="https://img.shields.io/badge/CrewAI-Orchestration-FF4F00?style=for-the-badge&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/LLaMA%203.3-70B-blue?style=for-the-badge&logo=meta&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-High%20Performance-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Scalable-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Admin-Intelligence%20System-6366f1?style=for-the-badge&logo=databricks&logoColor=white" />
</div>

<p align="center">
  <a href="#-about-planvix">🎯 About</a> •
  <a href="#-key-features">✨ Features</a> •
  <a href="#-architecture">🏗️ Architecture</a> •
  <a href="#-admin-intelligence-system">🛡️ Admin System</a> •
  <a href="#-quickstart">⚡ Quickstart</a> •
  <a href="#-pricing">💳 Pricing</a>
</p>

---

## 🎯 About Planvix

**Planvix is not just another wrapper.** It is a **Multi-Agent Operating System** that decomposes the complex task of content strategy into a pipeline of specialized autonomous agents, backed by a full **Enterprise SaaS Admin Intelligence System** for operators.

Unlike generic tools that give you a single "Answer," Planvix employs a **team of 5 expert agents** (Psychology, Trends, SEO, Strategy, ROI) working in sequence to build a cohesive, data-backed executable plan.

**Perfect for:**

- 🎬 **Content Creators** - Scaling from 0 to 1 consistently.
- 🚀 **Founders** - Automating the CMO role.
- 🏢 **Agencies** - Delivering premium strategies in minutes, not weeks.

---

## ✨ Key Features

| Feature                          | Description                                                                                         |
| :------------------------------- | :-------------------------------------------------------------------------------------------------- |
| **🤖 Multi-Agent Orchestration** | 5 autonomous agents collaborating sequentially (Persona → Trends → Traffic → Synthesis → ROI).      |
| **🧠 Deep Psychology**           | **Persona Agent** builds detailed avatars with pain points, triggers, and aspirations.              |
| **📈 Trend Sniper**              | **Trend Agent** identifies real-time market gaps and viral hook angles.                             |
| **🔍 SEO Architecture**          | **Traffic Agent** extracts high-volume keywords and hashtag stacks.                                 |
| **📅 Tactical Blueprint**        | **Synthesis Agent** generates a 30-day execution calendar and content pillars.                      |
| **💰 ROI Prediction**            | **ROI Agent** forecasts traffic lift, engagement boost, and reach estimates.                        |
| **🛡️ Enterprise Admin**          | Full Admin Intelligence System with real-time WebSocket feed, MongoDB analytics, health monitoring. |
| **📊 Analytics Engine**          | MRR, ARPU, Churn Rate, User Growth, Tier Distribution — all from live MongoDB aggregations.         |
| **⚡ Real-time Activity**        | WebSocket-powered live activity feed: user signups, strategy events, admin actions.                 |
| **🔒 JWT Admin Auth**            | Dedicated admin JWT (8h sessions, `role:admin` claim), separate from user auth.                     |
| **📈 Recharts Dashboards**       | AreaCharts, PieCharts, BarCharts, animated CountUp KPI cards, sparklines.                           |

---

## 🏗️ Architecture

Planvix follows a modular **N-Tier Architecture** with a dedicated Admin Intelligence layer:

```mermaid
graph TD
    classDef layer fill:#0f172a,stroke:#334155,stroke-width:2px,color:#e2e8f0
    classDef db fill:#1e293b,stroke:#334155,stroke-width:2px,color:#e2e8f0
    classDef admin fill:#052e16,stroke:#15803d,stroke-width:2px,color:#86efac

    subgraph Client_Side [Frontend Layer - React + Vite]
        UI[User Interface]
        Auth[AuthContext]
        AdminCtx[AdminAuthContext]
        Charts[Recharts Charts]
        WS_Client[WebSocket Client]
    end

    subgraph Server_Side [Backend Layer - FastAPI]
        Router[API Routers]
        AdminRouter[Admin Router - 9 endpoints]
        WS_Server[WebSocket Activity Feed]

        subgraph Orchestration [CrewAI Multi-Agent Layer]
            Orch[CrewAI Orchestrator]
            Agents[5 Agent Pool]
        end

        subgraph Services [Service Layer]
            Analytics[AnalyticsService - MongoDB Aggregations]
            Health[HealthService - psutil + ping]
        end
    end

    subgraph External [External Services]
        Groq[Groq LLM API]
    end

    subgraph Data [Data Layer]
        MongoDB[(MongoDB Atlas)]
        Redis[(Redis Cache)]
    end

    UI --> Auth
    Auth --> Router
    AdminCtx --> AdminRouter
    WS_Client --> WS_Server
    Router --> Orch
    Orch --> Agents
    Agents --> Groq
    AdminRouter --> Analytics
    AdminRouter --> Health
    Analytics --> MongoDB
    Health --> MongoDB
    Health --> Redis
    Router --> MongoDB
    Router --> Redis
    WS_Server --> MongoDB

    class UI,Auth,AdminCtx,Charts,WS_Client layer
    class Router,AdminRouter,WS_Server,Orch,Agents,Analytics,Health layer
    class MongoDB,Redis db
```

---

## 🛡️ Admin Intelligence System

A production-grade SaaS admin dashboard comparable to Stripe/Vercel dashboards.

### Admin Login

```
POST /api/admin/login
Body: { "secret": "your_admin_secret" }
Response: { "access_token": "eyJ...", "token_type": "bearer" }
```

Navigate to `http://localhost:5173/admin-login` and enter your `ADMIN_SECRET`.

### Dashboard Tabs

| Tab                 | What it shows                                                                       |
| ------------------- | ----------------------------------------------------------------------------------- |
| **Overview**        | 8 KPI cards (MRR, Users, Strategies, ARPU, Churn, Tier counts) + 4 Recharts charts  |
| **Users**           | Server-side search/filter/pagination, per-user tokens & revenue, CSV export         |
| **Revenue**         | MRR trend, ARPU, churn, industry revenue breakdown, tier breakdown with ₹ revenue   |
| **AI Intelligence** | Total tokens, requests, cost estimate, daily usage chart, most active industry/mode |
| **Live Activity**   | Real-time WebSocket event feed, notification bell, persisted admin_logs             |
| **System Health**   | MongoDB/Redis latency, CPU/memory (psutil), uptime, overall status banner           |

### WebSocket Activity Feed

Events broadcast automatically on: User signup → Strategy generated → Strategy deleted → Admin login

```
ws://localhost:8000/ws/admin/activity
```

---

## ⚡ Quickstart

Get Planvix running in **under 60 seconds**:

### 1️⃣ Clone Repository

```bash
git clone https://github.com/ayush-lakhani/stratify-ai.git
cd stratify-ai
```

### 2️⃣ Backend Setup

_Requires Python 3.11+_

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env — set MONGODB_URL, GROQ_API_KEY, JWT_SECRET_KEY, ADMIN_SECRET
python run.py
```

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4️⃣ Launch

| URL                                 | Purpose                |
| ----------------------------------- | ---------------------- |
| `http://localhost:5173`             | Main app (user-facing) |
| `http://localhost:5173/admin-login` | Admin dashboard login  |
| `http://localhost:8000/docs`        | FastAPI Swagger UI     |

---

## 🛠️ Tech Stack

<div align="center">

### Frontend

![React](https://img.shields.io/badge/React%2018-61DAFB?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22d3ee?style=flat-square&logo=chartdotjs&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide%20Icons-f59e0b?style=flat-square)

### Backend

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python%203.11-3776AB?style=flat-square&logo=python&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-10b981?style=flat-square)
![CrewAI](https://img.shields.io/badge/CrewAI-Orchestrator-FF4F00?style=flat-square)
![psutil](https://img.shields.io/badge/psutil-System%20Monitor-6366f1?style=flat-square)

### Data & AI

![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=flat-square&logo=redis&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LPU-FF6B6B?style=flat-square)

</div>

---

## 🔧 Environment Variables

```bash
# .env (backend)
MONGODB_URL=mongodb+srv://...
GROQ_API_KEY=gsk_...
JWT_SECRET_KEY=your-super-secret-key-change-in-production
ADMIN_SECRET=your-admin-secret          # Used to log into /admin-login
REDIS_URL=redis://localhost:6379
PROJECT_NAME=Planvix
VERSION=2.0.0
RATE_LIMIT_PER_MINUTE=30
```

---

## 💳 Pricing

| Tier              | Strategies/Month | Price       | Features                                    |
| :---------------- | :--------------- | :---------- | :------------------------------------------ |
| **🆓 Starter**    | 3                | ₹0          | Core Agents, History Access                 |
| **⭐ Pro**        | Unlimited        | **₹299/mo** | All Agents, Priority Queue, ROI Predictions |
| **🏢 Enterprise** | Custom           | **₹999/mo** | White-label, API Access, Team Seats         |

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">
  <h3>⚡ LLaMA 3.3 70B • 📊 Enterprise Admin • 🇮🇳 Made in India</h3>
  <p><strong>Developed by Ayush Lakhani</strong></p>
</div>
