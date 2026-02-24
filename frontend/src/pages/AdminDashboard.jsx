/**
 * Enterprise SaaS Admin Intelligence System
 * Comparable to Stripe / Vercel / Supabase dashboards
 * All data from MongoDB aggregations via /api/admin/analytics
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  LogOut,
  Bell,
  Search,
  Settings,
  Users,
  DollarSign,
  Zap,
  Activity,
  Database,
  Cpu,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Brain,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Hash,
} from "lucide-react";
import { KPICard } from "../components/kpi/KPICard";
import {
  RevenueLineChart,
  UserGrowthAreaChart,
} from "../components/charts/RevenueAndUserCharts";
import {
  TierDistributionPieChart,
  IndustryBarChart,
  AITokenTrendChart,
} from "../components/charts/PieAndBarCharts";
import { AnalyticsService } from "../services/AnalyticsService";
import { HealthService } from "../services/HealthService";
import { WebSocketService } from "../services/WebSocketService";

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════ */
const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "revenue", label: "Revenue", icon: DollarSign },
  { id: "ai", label: "AI Intelligence", icon: Brain },
  { id: "activity", label: "Live Activity", icon: Activity },
  { id: "health", label: "System Health", icon: Database },
];

const EVENT_COLORS = {
  user_signup: {
    dot: "bg-blue-500",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: "👤",
    label: "User Signup",
  },
  strategy_generated: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: "⚡",
    label: "Strategy Generated",
  },
  strategy_deleted: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: "🗑️",
    label: "Strategy Deleted",
  },
  payment_received: {
    dot: "bg-violet-500",
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    icon: "💰",
    label: "Payment",
  },
  admin_login: {
    dot: "bg-rose-500",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    icon: "🔒",
    label: "Admin Login",
  },
  default: {
    dot: "bg-slate-500",
    badge: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    icon: "📌",
    label: "System Event",
  },
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function EnterpriseAdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState({
    users: [],
    total: 0,
    page: 1,
    pages: 1,
  });
  const [logs, setLogs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [wsConnected, setWsConnected] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const activityEndRef = useRef(null);
  const navigate = useNavigate();
  const env = import.meta.env.MODE === "production" ? "PROD" : "DEV";

  /* ── Auth guard ─────────────────────────────── */
  const token = localStorage.getItem("admin_token");
  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
      return;
    }
    loadAnalytics();
    loadHealth();
    loadLogs();
    // Health auto-refresh 30s
    const hi = setInterval(loadHealth, 30000);
    return () => clearInterval(hi);
  }, []);

  /* ── WebSocket activity feed ────────────────── */
  useEffect(() => {
    if (!token) return;
    WebSocketService.connect((evt) => {
      setWsConnected(true);
      if (evt.type === "pong") return;
      setActivities((prev) => {
        const updated = [evt, ...prev].slice(0, 200);
        return updated;
      });
      setNotifications((n) => n + 1);
    });
    return () => WebSocketService.disconnect();
  }, []);

  /* ── Auto-scroll activity feed ──────────────── */
  useEffect(() => {
    if (tab === "activity")
      activityEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activities, tab]);

  /* ── Load users when tab / filter changes ───── */
  useEffect(() => {
    if (tab === "users") loadUsers();
  }, [tab, page, tierFilter]);

  /* ── Fetch functions ────────────────────────── */
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      setAnalytics(await AnalyticsService.getAnalytics());
    } catch (e) {
      if (e.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      setHealth(await HealthService.getHealth());
    } catch (_) {
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await AnalyticsService.getUsers({
        search,
        tier: tierFilter,
        page,
        limit: 15,
      });
      setUsers(data);
    } catch (e) {
      if (e.response?.status === 401) logout();
    } finally {
      setUsersLoading(false);
    }
  }, [search, tierFilter, page]);

  const loadLogs = useCallback(async () => {
    try {
      const data = await AnalyticsService.getAdminLogs(100);
      setLogs(data.logs || []);
    } catch (_) {}
  }, []);

  const logout = () => {
    localStorage.removeItem("admin_token");
    WebSocketService.disconnect();
    navigate("/admin-login");
  };

  const kpi = analytics?.kpis || {};
  const sparkRevenue = (analytics?.revenue_trend || [])
    .slice(-7)
    .map((r) => ({ v: r.revenue }));
  const sparkUsers = (analytics?.user_growth || [])
    .slice(-7)
    .map((r) => ({ v: r.users }));

  /* ══ RENDER ═══════════════════════════════════════════════ */
  return (
    <div
      className="min-h-screen text-white font-sans"
      style={{
        background:
          "linear-gradient(135deg, #020817 0%, #0a1628 40%, #040d1a 100%)",
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b border-slate-800/60"
        style={{
          background: "rgba(2,8,23,0.85)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Planvix Admin
              </h1>
              <p className="text-[10px] text-slate-500 -mt-0.5">
                Intelligence System
              </p>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ml-1 ${
                env === "PROD"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              {env}
            </span>
          </div>

          {/* Global Search */}
          <div className="relative flex-1 max-w-sm hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="Search users, strategies..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(e.target.value);
                  setTab("users");
                  loadUsers();
                }
              }}
            />
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2 shrink-0">
            {/* WS indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div
                className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`}
              />
              <span className="text-[10px] text-slate-400 font-mono">
                {wsConnected ? "LIVE" : "CONN..."}
              </span>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setNotifications(0);
                }}
                className="relative p-2 rounded-xl hover:bg-slate-800/70 transition-all border border-transparent hover:border-slate-700/50"
              >
                <Bell className="w-4 h-4 text-slate-400" />
                {notifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {notifications > 9 ? "9+" : notifications}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-10 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-800">
                    <p className="text-sm font-semibold text-white">
                      Recent Events
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {activities.slice(0, 8).map((a, i) => {
                      const ec = EVENT_COLORS[a.type] || EVENT_COLORS.default;
                      return (
                        <div
                          key={i}
                          className="px-4 py-2.5 border-b border-slate-800/50 hover:bg-slate-800/40"
                        >
                          <div className="flex items-center gap-2">
                            <span>{ec.icon}</span>
                            <span className="text-xs text-slate-300">
                              {a.details || ec.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {a.time}
                          </p>
                        </div>
                      );
                    })}
                    {activities.length === 0 && (
                      <div className="p-4 text-center text-slate-500 text-sm">
                        No events yet
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={loadAnalytics}
              title="Refresh analytics"
              className="p-2 rounded-xl hover:bg-slate-800/70 transition-all border border-transparent hover:border-slate-700/50"
            >
              <RefreshCw
                className={`w-4 h-4 text-slate-400 ${loading ? "animate-spin" : ""}`}
              />
            </button>

            {/* Admin avatar + logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
                A
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-xl transition-all text-sm border border-transparent hover:border-slate-700/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── TAB BAR ────────────────────────────────────────── */}
      <div
        className="sticky top-[60px] z-40 border-b border-slate-800/60"
        style={{
          background: "rgba(2,8,23,0.80)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                    tab === t.id
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* ═══ OVERVIEW TAB ══════════════════════════════════ */}
        {tab === "overview" && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
              <KPICard
                title="Monthly Recurring Revenue"
                value={kpi.mrr || 0}
                prefix="₹"
                change={kpi.mrr_growth || 0}
                color="emerald"
                loading={loading}
                icon={<DollarSign className="w-5 h-5" />}
                sparkline={sparkRevenue}
              />
              <KPICard
                title="Total Users"
                value={kpi.total_users || 0}
                changeLbl={`${kpi.active_users || 0} active`}
                change={0}
                color="blue"
                loading={loading}
                icon={<Users className="w-5 h-5" />}
                sparkline={sparkUsers}
              />
              <KPICard
                title="Active Strategies"
                value={kpi.active_strategies || 0}
                changeLbl="Live"
                change={0}
                color="violet"
                loading={loading}
                icon={<Zap className="w-5 h-5" />}
              />
              <KPICard
                title="ARPU"
                value={kpi.arpu || 0}
                prefix="₹"
                changeLbl={`${kpi.paid_users || 0} paid`}
                change={0}
                color="amber"
                loading={loading}
                icon={<TrendingUp className="w-5 h-5" />}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                title="Pro Users"
                value={kpi.pro_users || 0}
                changeLbl="Subscribed"
                change={0}
                color="emerald"
                loading={loading}
                icon={<ArrowUpRight className="w-5 h-5" />}
              />
              <KPICard
                title="Free Users"
                value={kpi.free_users || 0}
                changeLbl="Free tier"
                change={0}
                color="cyan"
                loading={loading}
                icon={<Layers className="w-5 h-5" />}
              />
              <KPICard
                title="Churn Rate"
                value={kpi.churn_rate || 0}
                suffix="%"
                change={-(kpi.churn_rate || 0)}
                color="rose"
                loading={loading}
                icon={<ArrowDownRight className="w-5 h-5" />}
              />
              <KPICard
                title="Enterprise Users"
                value={kpi.enterprise_users || 0}
                changeLbl="Enterprise"
                change={0}
                color="violet"
                loading={loading}
                icon={<Globe className="w-5 h-5" />}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <GlassCard
                title="Revenue Trend"
                subtitle="Last 30 days"
                icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
              >
                <RevenueLineChart data={analytics?.revenue_trend || []} />
              </GlassCard>
              <GlassCard
                title="User Growth"
                subtitle="New signups daily"
                icon={<Users className="w-4 h-4 text-blue-400" />}
              >
                <UserGrowthAreaChart data={analytics?.user_growth || []} />
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <GlassCard
                title="Tier Distribution"
                subtitle="Users by subscription"
                icon={<Layers className="w-4 h-4 text-violet-400" />}
              >
                <TierDistributionPieChart
                  data={analytics?.tier_distribution || {}}
                />
              </GlassCard>
              <GlassCard
                title="Top Industries"
                subtitle="By strategy count"
                icon={<BarChart3 className="w-4 h-4 text-amber-400" />}
              >
                <IndustryBarChart data={analytics?.industry_breakdown || []} />
              </GlassCard>
            </div>
          </div>
        )}

        {/* ═══ USERS TAB ═════════════════════════════════════ */}
        {tab === "users" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (setPage(1), loadUsers())
                  }
                  placeholder="Search by email or name…"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>
              <select
                value={tierFilter}
                onChange={(e) => {
                  setTierFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-emerald-500/50"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <button
                onClick={loadUsers}
                className="px-4 py-2.5 bg-slate-800/70 hover:bg-slate-700 border border-slate-700/50 text-slate-300 rounded-xl text-sm transition-all flex items-center gap-2"
              >
                <Filter className="w-4 h-4" /> Apply
              </button>
              <button
                onClick={() => AnalyticsService.exportCSV()}
                className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <span className="ml-auto text-sm text-slate-500">
                {users.total} total users
              </span>
            </div>

            {/* Table */}
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl overflow-hidden backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-900/80">
                      {[
                        "User",
                        "Tier",
                        "Strategies",
                        "Usage",
                        "AI Tokens",
                        "Revenue",
                        "Joined",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {usersLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={7} className="px-5 py-4">
                            <div className="h-4 bg-slate-800/60 rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : users.users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-12 text-center text-slate-500"
                        >
                          No users found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      users.users.map((u, i) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-800/30 transition-all group"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg flex items-center justify-center text-xs font-bold text-slate-300">
                                {u.email?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-200">
                                  {u.name || u.email?.split("@")[0]}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <TierBadge tier={u.tier} />
                          </td>
                          <td className="px-5 py-4 text-slate-300 text-sm font-mono">
                            {u.strategies_count}
                          </td>
                          <td className="px-5 py-4 text-slate-300 text-sm font-mono">
                            {u.usage_count}
                          </td>
                          <td className="px-5 py-4 text-slate-300 text-sm font-mono">
                            {u.tokens_used >= 1000
                              ? `${(u.tokens_used / 1000).toFixed(1)}K`
                              : u.tokens_used}
                          </td>
                          <td className="px-5 py-4 text-sm font-mono">
                            <span
                              className={
                                u.revenue_generated > 0
                                  ? "text-emerald-400"
                                  : "text-slate-500"
                              }
                            >
                              {u.revenue_generated > 0
                                ? `₹${u.revenue_generated}`
                                : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs font-mono">
                            {u.created_at
                              ? new Date(u.created_at).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {users.pages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800/50">
                  <span className="text-xs text-slate-500">
                    Page {users.page} of {users.pages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      disabled={page >= users.pages}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-all"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ REVENUE TAB ═══════════════════════════════════ */}
        {tab === "revenue" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                title="MRR"
                value={kpi.mrr || 0}
                prefix="₹"
                change={kpi.mrr_growth || 0}
                color="emerald"
                loading={loading}
                icon={<DollarSign className="w-5 h-5" />}
                sparkline={sparkRevenue}
              />
              <KPICard
                title="ARPU"
                value={kpi.arpu || 0}
                prefix="₹"
                changeLbl="Per paid user"
                change={0}
                color="blue"
                loading={loading}
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <KPICard
                title="Paid Users"
                value={kpi.paid_users || 0}
                changeLbl="Pro + Enterprise"
                change={0}
                color="violet"
                loading={loading}
                icon={<Users className="w-5 h-5" />}
              />
              <KPICard
                title="Churn Rate"
                value={kpi.churn_rate || 0}
                suffix="%"
                change={-(kpi.churn_rate || 0)}
                color="rose"
                loading={loading}
                icon={<ArrowDownRight className="w-5 h-5" />}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <GlassCard
                  title="Revenue Trend"
                  subtitle="Daily revenue (last 30 days)"
                  icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
                >
                  <RevenueLineChart data={analytics?.revenue_trend || []} />
                </GlassCard>
              </div>
              <GlassCard
                title="Revenue by Industry"
                subtitle="By strategy volume"
                icon={<Globe className="w-4 h-4 text-amber-400" />}
              >
                <IndustryBarChart data={analytics?.industry_breakdown || []} />
              </GlassCard>
            </div>

            <GlassCard
              title="Tier Distribution"
              subtitle="Revenue contribution by plan"
              icon={<Layers className="w-4 h-4 text-violet-400" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <TierDistributionPieChart
                  data={analytics?.tier_distribution || {}}
                />
                <div className="space-y-4">
                  {[
                    {
                      name: "Free",
                      count: kpi.free_users || 0,
                      color: "bg-slate-500",
                      revenue: 0,
                    },
                    {
                      name: "Pro",
                      count: kpi.pro_users || 0,
                      color: "bg-emerald-500",
                      revenue: (kpi.pro_users || 0) * 299,
                    },
                    {
                      name: "Enterprise",
                      count: kpi.enterprise_users || 0,
                      color: "bg-violet-500",
                      revenue: (kpi.enterprise_users || 0) * 999,
                    },
                  ].map((tier) => (
                    <div
                      key={tier.name}
                      className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {tier.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {tier.count} users
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-mono text-emerald-400">
                        ₹{tier.revenue.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* ═══ AI INTELLIGENCE TAB ════════════════════════════ */}
        {tab === "ai" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                title="Total Tokens"
                value={analytics?.ai_usage?.total_tokens || 0}
                changeLbl="Consumed"
                change={0}
                color="violet"
                loading={loading}
                icon={<Hash className="w-5 h-5" />}
              />
              <KPICard
                title="Total Requests"
                value={analytics?.ai_usage?.total_requests || 0}
                changeLbl="All time"
                change={0}
                color="blue"
                loading={loading}
                icon={<Zap className="w-5 h-5" />}
              />
              <KPICard
                title="Cost Estimate"
                value={analytics?.ai_usage?.cost_estimate || 0}
                prefix="$"
                changeLbl="Approx."
                change={0}
                color="amber"
                loading={loading}
                icon={<DollarSign className="w-5 h-5" />}
              />
              <KPICard
                title="Avg Tokens/Request"
                value={
                  analytics?.ai_usage?.total_requests > 0
                    ? Math.round(
                        (analytics?.ai_usage?.total_tokens || 0) /
                          analytics?.ai_usage?.total_requests,
                      )
                    : 0
                }
                changeLbl="Per strategy"
                change={0}
                color="cyan"
                loading={loading}
                icon={<Brain className="w-5 h-5" />}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <GlassCard
                title="Daily Token Usage"
                subtitle="Last 7 days"
                icon={<Brain className="w-4 h-4 text-violet-400" />}
              >
                <AITokenTrendChart
                  data={analytics?.ai_usage?.daily_tokens || []}
                />
              </GlassCard>
              <GlassCard
                title="AI Intelligence Insights"
                icon={<Cpu className="w-4 h-4 text-cyan-400" />}
              >
                <div className="space-y-4 pt-2">
                  {[
                    {
                      label: "Most Active Industry",
                      value: analytics?.ai_usage?.most_active_industry || "N/A",
                      icon: "🏭",
                    },
                    {
                      label: "Most Used Strategy Mode",
                      value: analytics?.ai_usage?.most_used_mode || "standard",
                      icon: "⚡",
                    },
                    {
                      label: "Cost per Strategy",
                      value:
                        analytics?.ai_usage?.total_requests > 0
                          ? `$${((analytics?.ai_usage?.cost_estimate || 0) / analytics?.ai_usage?.total_requests).toFixed(5)}`
                          : "$0",
                      icon: "💰",
                    },
                    {
                      label: "Total Strategies Generated",
                      value: (
                        analytics?.ai_usage?.total_requests || 0
                      ).toLocaleString(),
                      icon: "📊",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30 hover:bg-slate-800/60 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <p className="text-sm text-slate-400">{item.label}</p>
                      </div>
                      <p className="text-sm font-semibold text-white capitalize">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            <GlassCard
              title="Industry Breakdown"
              subtitle="Strategies by industry"
              icon={<BarChart3 className="w-4 h-4 text-amber-400" />}
            >
              <IndustryBarChart data={analytics?.industry_breakdown || []} />
            </GlassCard>
          </div>
        )}

        {/* ═══ LIVE ACTIVITY TAB ══════════════════════════════ */}
        {tab === "activity" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${wsConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`}
                />
                <h2 className="text-lg font-bold text-white">
                  Real-time Activity Feed
                </h2>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                  {wsConnected ? "LIVE" : "Connecting..."}
                </span>
              </div>
              <span className="text-sm text-slate-500">
                {activities.length} events
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl overflow-hidden backdrop-blur-xl max-h-[600px] overflow-y-auto">
              {activities.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-3">📡</div>
                  <p className="text-slate-400 font-medium">
                    Waiting for events…
                  </p>
                  <p className="text-slate-600 text-sm mt-1">
                    Activity will appear here in real-time
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/40">
                  {activities.map((evt, i) => {
                    const ec = EVENT_COLORS[evt.type] || EVENT_COLORS.default;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-800/30 transition-all"
                      >
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <div
                            className={`w-2 h-2 rounded-full ${ec.dot} shrink-0`}
                          />
                          {i < activities.length - 1 && (
                            <div className="w-px h-4 bg-slate-800" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${ec.badge}`}
                            >
                              {ec.icon} {ec.label}
                            </span>
                            {evt.email && (
                              <span className="text-xs text-slate-400">
                                {evt.email}
                              </span>
                            )}
                            {evt.details && (
                              <span className="text-xs text-slate-500 truncate">
                                {evt.details}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600 text-xs font-mono shrink-0">
                          <Clock className="w-3 h-3" />
                          {evt.time || "—"}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={activityEndRef} />
                </div>
              )}
            </div>

            {/* Admin Logs Section */}
            {logs.length > 0 && (
              <GlassCard
                title="Admin Action Log"
                subtitle="Persistent action history"
                icon={<Settings className="w-4 h-4 text-slate-400" />}
              >
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/30 rounded-xl border border-slate-700/20 hover:bg-slate-800/50 transition-all"
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          log.severity === "warning"
                            ? "bg-amber-500"
                            : log.severity === "success"
                              ? "bg-emerald-500"
                              : log.severity === "error"
                                ? "bg-red-500"
                                : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 truncate">
                          {log.action}: {log.details}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-600 font-mono shrink-0">
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleString()
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* ═══ SYSTEM HEALTH TAB ══════════════════════════════ */}
        {tab === "health" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                System Health Monitor
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Auto-refresh 30s</span>
                <button
                  onClick={loadHealth}
                  className="p-1.5 rounded-lg hover:bg-slate-800 transition-all"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-slate-400 ${healthLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Overall status banner */}
            {health && (
              <div
                className={`flex items-center gap-3 p-4 rounded-2xl border ${
                  health.overall === "operational"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                }`}
              >
                {health.overall === "operational" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                <div>
                  <p className="font-bold capitalize">
                    {health.overall === "operational"
                      ? "All Systems Operational"
                      : "Degraded Performance"}
                  </p>
                  <p className="text-xs opacity-70">
                    Last checked:{" "}
                    {health.last_updated
                      ? new Date(health.last_updated).toLocaleTimeString()
                      : "—"}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <HealthCard
                label="MongoDB"
                status={health?.mongo}
                latency={health?.mongo_latency_ms}
                loading={healthLoading}
                icon={<Database className="w-5 h-5" />}
              />
              <HealthCard
                label="Redis Cache"
                status={health?.redis}
                latency={health?.redis_latency_ms}
                loading={healthLoading}
                icon={<Zap className="w-5 h-5" />}
              />
              <HealthCard
                label="AI Agents"
                status={health?.agents === "running" ? "healthy" : "warning"}
                metric={health?.agents}
                loading={healthLoading}
                icon={<Brain className="w-5 h-5" />}
              />
              <HealthCard
                label="CPU Usage"
                status={
                  health?.cpu_usage >= 90
                    ? "error"
                    : health?.cpu_usage >= 70
                      ? "warning"
                      : "healthy"
                }
                metric={`${health?.cpu_usage || 0}%`}
                loading={healthLoading}
                icon={<Cpu className="w-5 h-5" />}
              />
              <HealthCard
                label="Memory"
                status={
                  health?.memory_usage >= 90
                    ? "error"
                    : health?.memory_usage >= 75
                      ? "warning"
                      : "healthy"
                }
                metric={`${health?.memory_usage || 0}% (${health?.memory_used_mb || 0} MB)`}
                loading={healthLoading}
                icon={<Activity className="w-5 h-5" />}
              />
              <HealthCard
                label="Uptime"
                status="healthy"
                metric={health?.uptime || "—"}
                loading={healthLoading}
                icon={<Clock className="w-5 h-5" />}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
══════════════════════════════════════════════════════════════ */
function GlassCard({ title, subtitle, icon, children }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-5">
        {icon && <div className="shrink-0">{icon}</div>}
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function TierBadge({ tier }) {
  const map = {
    pro: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    enterprise: "bg-violet-500/10  text-violet-400  border-violet-500/20",
    free: "bg-slate-700/40   text-slate-400   border-slate-600/30",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${map[tier] || map.free}`}
    >
      {(tier || "free").toUpperCase()}
    </span>
  );
}

function HealthCard({ label, status, latency, metric, loading, icon }) {
  const map = {
    healthy: {
      bg: "bg-emerald-500/10 border-emerald-500/30",
      dot: "bg-emerald-500",
      text: "text-emerald-400",
      badge: "text-emerald-400",
    },
    warning: {
      bg: "bg-amber-500/10  border-amber-500/30",
      dot: "bg-amber-500",
      text: "text-amber-400",
      badge: "text-amber-400",
    },
    error: {
      bg: "bg-red-500/10    border-red-500/30",
      dot: "bg-red-500",
      text: "text-red-400",
      badge: "text-red-400",
    },
    disabled: {
      bg: "bg-slate-800/40  border-slate-700/30",
      dot: "bg-slate-600",
      text: "text-slate-400",
      badge: "text-slate-400",
    },
  };
  const s =
    status === "healthy"
      ? "healthy"
      : status === "disabled"
        ? "disabled"
        : status === "error"
          ? "error"
          : "warning";
  const c = map[s] || map.disabled;

  if (loading)
    return (
      <div className="p-5 rounded-2xl border border-slate-800/50 bg-slate-900/60 animate-pulse">
        <div className="h-4 bg-slate-800 rounded mb-3 w-1/2" />
        <div className="h-6 bg-slate-800 rounded w-3/4" />
      </div>
    );

  return (
    <div
      className={`p-5 rounded-2xl border ${c.bg} backdrop-blur-xl hover:brightness-110 transition-all`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 ${c.text}`}>
          {icon}
          <span className="text-sm font-semibold text-slate-200">{label}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
      </div>
      <div className={`text-xl font-bold ${c.badge} capitalize`}>
        {metric || status || "—"}
      </div>
      {latency != null && (
        <p className="text-xs text-slate-500 mt-1">{latency}ms latency</p>
      )}
    </div>
  );
}
