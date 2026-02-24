import CountUp from "react-countup";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Enterprise KPI Card — animated counter, growth badge, sparkline
 */
export function KPICard({
  title,
  value = 0,
  prefix = "",
  suffix = "",
  change = 0, // numeric %
  changeLbl = "", // override label
  icon,
  color = "emerald",
  sparkline = [], // [{v:n}]
  loading = false,
}) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const colorMap = {
    emerald: {
      glow: "from-emerald-500/20 to-emerald-600/10",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      spark: "#10b981",
    },
    blue: {
      glow: "from-blue-500/20 to-blue-600/10",
      border: "border-blue-500/20",
      text: "text-blue-400",
      badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      spark: "#3b82f6",
    },
    violet: {
      glow: "from-violet-500/20 to-violet-600/10",
      border: "border-violet-500/20",
      text: "text-violet-400",
      badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      spark: "#8b5cf6",
    },
    amber: {
      glow: "from-amber-500/20 to-amber-600/10",
      border: "border-amber-500/20",
      text: "text-amber-400",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      spark: "#f59e0b",
    },
    rose: {
      glow: "from-rose-500/20 to-rose-600/10",
      border: "border-rose-500/20",
      text: "text-rose-400",
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      spark: "#f43f5e",
    },
    cyan: {
      glow: "from-cyan-500/20 to-cyan-600/10",
      border: "border-cyan-500/20",
      text: "text-cyan-400",
      badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      spark: "#06b6d4",
    },
  };
  const c = colorMap[color] || colorMap.emerald;

  if (loading) {
    return (
      <div className="p-6 rounded-3xl border border-slate-800/50 bg-slate-900/60 animate-pulse">
        <div className="h-4 bg-slate-800 rounded mb-4 w-1/2" />
        <div className="h-8 bg-slate-800 rounded mb-2 w-3/4" />
        <div className="h-3 bg-slate-800 rounded w-1/3" />
      </div>
    );
  }

  return (
    <div
      className="group relative p-6 rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-950/60
      hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl overflow-hidden cursor-default"
    >
      {/* Glow */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${c.glow} rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none`}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-5 relative">
        <div
          className={`w-12 h-12 bg-gradient-to-br ${c.glow} border ${c.border} ${c.text}
          rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}
        >
          {icon}
        </div>
        <span
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${c.badge}`}
        >
          {isNeutral ? (
            <Minus className="w-3 h-3" />
          ) : isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {changeLbl ||
            (isNeutral ? "Stable" : `${isPositive ? "+" : ""}${change}%`)}
        </span>
      </div>

      {/* Value */}
      <div className="relative mb-1">
        <span className="text-slate-400 text-xs font-medium">{prefix}</span>
        <span className="text-3xl font-black text-white tabular-nums">
          <CountUp
            end={typeof value === "number" ? value : 0}
            duration={1.5}
            separator=","
            decimals={value % 1 !== 0 ? 2 : 0}
          />
        </span>
        {suffix && (
          <span className="text-slate-400 text-sm ml-1">{suffix}</span>
        )}
      </div>
      <p className="text-slate-400 font-medium text-sm relative">{title}</p>

      {/* Sparkline */}
      {sparkline.length > 1 && (
        <div className="mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height={36}>
            <LineChart data={sparkline}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={c.spark}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
