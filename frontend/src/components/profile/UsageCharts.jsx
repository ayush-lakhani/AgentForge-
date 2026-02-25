import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, Zap, BarChart3 } from "lucide-react";
import { safeDate } from "../../utils/dateUtils";

export default function UsageCharts({ analytics, loading }) {
  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-card p-6 h-[350px] rounded-3xl animate-pulse bg-slate-100 dark:bg-slate-800/50"
          />
        ))}
      </div>
    );
  }

  // Safe destructuring with fallbacks
  const usageHistory =
    analytics?.usage_history || analytics?.monthly_strategies || [];
  const topIndustries =
    analytics?.top_industries || analytics?.industry_breakdown || [];
  const totalTokens = analytics?.total_tokens || 0;
  const totalStrategies = analytics?.total_strategies || 0;

  // Custom Tooltip for premium feel
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-white/20 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-950/90">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            {label ? safeDate(label) : "Point Data"}
          </p>
          <p className="text-sm font-black text-primary-500">
            {payload[0].value?.toLocaleString()} {payload[0].name}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* KPI Stats Bar - Elite Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "AI Generations",
            value: totalStrategies,
            color: "text-primary-500",
          },
          {
            label: "Token Pulse",
            value: totalTokens.toLocaleString(),
            color: "text-accent-500",
          },
          {
            label: "Industries",
            value: topIndustries.length,
            color: "text-emerald-500",
          },
          { label: "Efficiency", value: "98.4%", color: "text-amber-500" },
        ].map((stat, i) => (
          <div
            key={i}
            className="glass-card p-4 rounded-2xl border border-white/5"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              {stat.label}
            </p>
            <p className={`text-xl font-black tracking-tight ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 1. Strategy Output Pulse */}
        <div className="glass-card hover-lift p-6 rounded-3xl border border-white/5 group transition-all hover:border-primary-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-500/10 rounded-xl">
              <BarChart3 className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Strategy Output
              </h3>
              <p className="text-xs text-slate-500">
                Volume of AI intelligence across sessions
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageHistory}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f011"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  minTickGap={30}
                  tickFormatter={(val) =>
                    val?.split("-")?.slice(1)?.join("/") || ""
                  }
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#6366f108" }}
                />
                <Bar
                  dataKey="strategies"
                  name="Strategies"
                  radius={[4, 4, 0, 0]}
                >
                  {usageHistory.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 2 === 0 ? "#6366f1" : "#a855f7"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Token Intensity Area */}
        <div className="glass-card hover-lift p-6 rounded-3xl border border-white/5 group transition-all hover:border-accent-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent-500/10 rounded-xl">
              <Zap className="w-5 h-5 text-accent-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Compute Pulse
              </h3>
              <p className="text-xs text-slate-500">
                Real-time token distribution flow
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageHistory}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f011"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  minTickGap={30}
                  tickFormatter={(val) =>
                    val?.split("-")?.slice(1)?.join("/") || ""
                  }
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  name="Tokens"
                  stroke="#ec4899"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTokens)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Industry Breakdown - New Feature */}
        <div className="glass-card hover-lift p-6 rounded-3xl border border-white/5 lg:col-span-2 group transition-all hover:border-emerald-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Industry Intelligence
              </h3>
              <p className="text-xs text-slate-500">
                Specialization and niche dominance
              </p>
            </div>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topIndustries}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e2e8f011"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="industry"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }}
                  width={100}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#10b98108" }}
                />
                <Bar
                  dataKey="count"
                  name="Strategies"
                  radius={[0, 4, 4, 0]}
                  fill="#10b981"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
