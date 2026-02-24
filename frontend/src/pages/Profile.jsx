import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  TrendingUp,
  Settings,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ProfileHero from "../components/profile/ProfileHero";
import UsageCharts from "../components/profile/UsageCharts";
import ActivityTimeline from "../components/profile/ActivityTimeline";
import BillingCard from "../components/profile/BillingCard";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Profile() {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("intelligence");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [heroData, setHeroData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [billingData, setBillingData] = useState(null);

  // Unified Data Fetcher
  const fetchAllDashboardData = useCallback(
    async (isAutoRefresh = false) => {
      if (!token) return;
      if (!isAutoRefresh) setLoading(true);
      else setRefreshing(true);

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [heroRes, analyticsRes, activityRes, billingRes] =
          await Promise.all([
            axios.get(`${API_BASE}/api/profile`, { headers }),
            axios.get(`${API_BASE}/api/profile/analytics`, { headers }),
            axios.get(`${API_BASE}/api/profile/activity`, { headers }),
            axios.get(`${API_BASE}/api/profile/billing`, { headers }),
          ]);

        setHeroData(heroRes.data);
        setAnalyticsData(analyticsRes.data);
        setActivityData(activityRes.data);
        setBillingData(billingRes.data);
      } catch (error) {
        console.error("[DASHBOARD] Sync Error:", error);
        if (!isAutoRefresh) toast.error("Failed to sync intelligence data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  // Initial Load + 30s Polling
  useEffect(() => {
    fetchAllDashboardData();
    const interval = setInterval(() => fetchAllDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAllDashboardData]);

  const tabs = [
    { id: "intelligence", label: "Intelligence Hub", icon: TrendingUp },
    { id: "billing", label: "Usage & Quota", icon: CreditCard },
    { id: "settings", label: "Global Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4 sm:p-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto space-y-8 mt-12">
        {/* Header with Sync Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              Personal Intelligence Dashboard
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Real-time performance metrics & activity feed
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAllDashboardData()}
              disabled={refreshing}
              className={`p-2 rounded-xl glass-card transition-all ${refreshing ? "animate-spin border-primary-500" : "hover:scale-105 active:scale-95"}`}
            >
              <RefreshCw className="w-5 h-5 text-slate-500" />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100 dark:border-rose-900/50"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <ProfileHero data={heroData} loading={loading} />

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 glass-card p-1.5 rounded-2xl w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="animate-fade-in transition-all duration-500">
          {activeTab === "intelligence" && (
            <div className="space-y-8">
              <UsageCharts analytics={analyticsData} loading={loading} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ActivityTimeline activity={activityData} loading={loading} />
                <BillingCard billing={billingData} loading={loading} />
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <BillingCard billing={billingData} loading={loading} />
              <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Secure Billing
                </h3>
                <p className="text-slate-500 text-sm max-w-xs">
                  Our billing system uses Razropay's encrypted checkout for 100%
                  secure transactions.
                </p>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <SettingsPanel user={heroData} logout={logout} />
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component for Settings (Modular & Clean)
function SettingsPanel({ user, logout }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="max-w-3xl space-y-8">
      <div className="glass-card p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          Global Preferences
          <Settings className="w-5 h-5 text-primary-500" />
        </h3>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs font-black text-slate-400 tracking-tighter uppercase mb-1">
                Email Identification
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {user?.email}
              </p>
            </div>
            <span className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verified Account
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed">
            <div>
              <p className="text-xs font-black text-slate-400 tracking-tighter uppercase mb-1">
                Password Authentication
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                ••••••••••••
              </p>
            </div>
            <button
              disabled
              className="text-[10px] font-black uppercase text-slate-400"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 rounded-3xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/20 dark:bg-rose-950/5">
        <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 mb-6 flex items-center gap-2">
          Danger Zone
          <AlertTriangle className="w-5 h-5" />
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-medium leading-relaxed">
          Deleting your account will permanently wipe all generated strategies,
          historical data, and billing history. This action{" "}
          <strong>cannot be undone</strong>.
        </p>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-6 py-3 bg-white dark:bg-slate-900 text-rose-600 border border-rose-100 dark:border-rose-900 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-50 transition-all shadow-xl shadow-rose-900/5"
          >
            Initiate Account Deletion
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3 animate-slide-up">
            <button
              onClick={() => {
                toast.success("Demo: Account deletion is simulated.");
                logout();
              }}
              className="w-full sm:w-auto px-6 py-3 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-700 shadow-xl shadow-rose-900/20"
            >
              Confirm Permanent Deletion
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="w-full sm:w-auto px-6 py-3 glass-card text-slate-600 font-extrabold text-xs uppercase tracking-widest rounded-xl"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
