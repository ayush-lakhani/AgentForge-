import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import {
  Sparkles,
  TrendingUp,
  Zap,
  ArrowRight,
  Calendar,
  BarChart3,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { strategyAPI } from "../api";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyUsage, setMonthlyUsage] = useState(0);

  useEffect(() => {
    loadStrategies();
    fetchUsage();
  }, []);

  const loadStrategies = async () => {
    try {
      const data = await strategyAPI.getHistory(); // Already returns response.data
      console.log("[DASHBOARD] API response:", data);

      // Normalize response - backend may return array or {history: [...]}
      const strategiesArray = Array.isArray(data)
        ? data
        : data?.history || data?.strategies || [];

      console.log("[DASHBOARD] Extracted strategies:", strategiesArray);
      setStrategies(strategiesArray);
    } catch (error) {
      console.error("Failed to load strategies:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch("http://localhost:8000/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMonthlyUsage(data.usage_count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    }
  };

  const stats = {
    total: strategies.length,
    thisMonth: monthlyUsage, // Server-authoritative usage count
    limit: user?.tier === "pro" ? "Unlimited" : 3,
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="relative text-center mb-16 px-4 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight text-gray-900 dark:text-white">
            Watch 5 AI Agents{" "}
            <span className="bg-gradient-to-r from-primary-600 via-accent-600 to-pink-600 bg-clip-text text-transparent">
              Build Your Strategy
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4">
            Live multi-agent collaboration for professional content planning
          </p>
          <p className="text-lg font-black text-primary-600 dark:text-primary-400 tracking-wider uppercase">
            AGENTS BUILD STRATEGY
          </p>
        </div>

        {/* Stats Grid - Modern Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-slide-up">
          {/* Total Strategies */}
          <div className="relative group stagger-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative glass-card glass-card-3d p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {stats.total}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total Strategies
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                All time generated
              </p>
              <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                  style={{
                    width: `${Math.min((stats.total / 10) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* This Month */}
          <div className="relative group stagger-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative glass-card glass-card-3d p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Calendar className="w-6 h-6 text-purple-500" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {stats.thisMonth}/{stats.limit}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                This Month
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {user?.tier === "pro"
                  ? "Unlimited usage"
                  : `${3 - stats.thisMonth} remaining`}
              </p>
              <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  style={{
                    width:
                      user?.tier === "pro"
                        ? "100%"
                        : `${(stats.thisMonth / 3) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="relative group stagger-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative glass-card glass-card-3d p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <Zap className="w-6 h-6 text-green-500" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {stats.total > 0 ? "97%" : "--"}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Success Rate
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                All strategies delivered
              </p>
              <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Banner - Free Tier Limit */}
        {user?.tier !== "pro" && stats.thisMonth >= 3 && (
          <div className="mb-8 glass-card p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/10 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-1">
                  Monthly Limit Reached
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  You've used all 3 free strategies this month. Upgrade to Pro
                  for unlimited access!
                </p>
              </div>
              <button
                onClick={() => navigate("/upgrade")}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Main Action - Primary CTA */}
        <div
          className="mb-8 relative group animate-slide-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <button
            onClick={() => navigate("/planner")}
            disabled={user?.tier !== "pro" && stats.thisMonth >= 3}
            className="relative w-full glass-card glass-card-3d btn-3d p-8 rounded-3xl text-left transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl shadow-2xl">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Generate New Strategy
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Create AI-powered content strategies in 30 seconds with our
                    5 elite agents
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                      ⚡ 30s Generation
                    </span>
                    <span className="px-3 py-1 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 rounded-full text-sm font-medium">
                      📊 ROI Predictions
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-8 h-8 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-2 transition-all" />
            </div>
          </button>
        </div>

        {/* Secondary Actions Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          {/* View History */}
          <button
            onClick={() => navigate("/history")}
            className="glass-card p-6 rounded-2xl text-left transition-all hover:scale-[1.02] hover:shadow-xl group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                View Past Strategies
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Access all {stats.total} previously generated strategies and
              insights
            </p>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
              <span>Browse History</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Analytics (Coming Soon) */}
          <div className="glass-card p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 opacity-60">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gray-200 dark:bg-gray-800 rounded-xl">
                <BarChart3 className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Track performance metrics and ROI for your content strategies
            </p>
            <div className="flex items-center gap-2 text-gray-500 font-medium">
              <span>Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Recent Activity - If strategies exist */}
        {strategies.length > 0 && (
          <div
            className="mt-12 animate-slide-up"
            style={{ animationDelay: "300ms" }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Recent Activity
            </h2>
            <div className="space-y-3">
              {strategies.slice(0, 3).map((strategy, index) => (
                <button
                  key={strategy.id || index}
                  onClick={() => navigate("/history")}
                  className="w-full glass-card p-4 rounded-xl hover:shadow-lg transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {strategy.goal || "Strategy"}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {strategy.audience} • {strategy.platform}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {strategy.created_at &&
                      new Date(strategy.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
