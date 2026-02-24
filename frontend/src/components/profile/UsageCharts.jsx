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
        {[1, 2].map((i) => (
          <div
            key={i}
            className="glass-card p-6 h-[400px] rounded-3xl animate-pulse bg-slate-100 dark:bg-slate-800"
          />
        ))}
      </div>
    );
  }

  const { monthly_strategies, token_usage, growth_trend } = analytics;

  // Custom Tooltip for premium feel
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-white/20 shadow-2xl backdrop-blur-xl">
          <p className="text-xs font-bold text-slate-500 mb-1">
            {safeDate(label)}
          </p>
          <p className="text-sm font-black text-primary-600">
            {payload[0].value.toLocaleString()} {payload[0].name}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* 1. Strategies Created (Bar Chart) */}
      <div className="glass-card p-6 rounded-3xl group transition-all hover:shadow-2xl hover:shadow-primary-500/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <BarChart3 className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Strategy Output
            </h3>
            <p className="text-xs text-slate-500">
              Number of strategies generated daily
            </p>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly_strategies}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f033"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748b" }}
                minTickGap={30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#6366f111" }}
              />
              <Bar dataKey="count" name="Strategies" radius={[4, 4, 0, 0]}>
                {monthly_strategies.map((entry, index) => (
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

      {/* 2. Token Consumption (Area Chart) */}
      <div className="glass-card p-6 rounded-3xl group transition-all hover:shadow-2xl hover:shadow-accent-500/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-xl">
            <Zap className="w-5 h-5 text-accent-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Compute Intensity
            </h3>
            <p className="text-xs text-slate-500">AI token consumption trend</p>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={token_usage}>
              <defs>
                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f033"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748b" }}
                minTickGap={30}
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

      {/* 3. Monthly Growth (Line Chart) - Large */}
      <div className="glass-card p-6 rounded-3xl lg:col-span-2 group transition-all hover:shadow-2xl hover:shadow-emerald-500/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Growth Velocity
            </h3>
            <p className="text-xs text-slate-500">
              Historical performance scaling
            </p>
          </div>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growth_trend}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f033"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="stepAfter"
                dataKey="value"
                name="Value"
                stroke="#10b981"
                strokeWidth={4}
                dot={{ r: 6, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
