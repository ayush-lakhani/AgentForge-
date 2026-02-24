import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const TIER_COLORS = { free: "#64748b", pro: "#10b981", enterprise: "#8b5cf6" };
const BAR_COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
];

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-white font-bold capitalize">{payload[0]?.name}</p>
      <p className="text-slate-300 text-sm">{payload[0]?.value} users</p>
      <p className="text-slate-400 text-xs">
        {payload[0]?.payload?.percent?.toFixed(1)}%
      </p>
    </div>
  );
};

export function TierDistributionPieChart({ data = {} }) {
  const chartData = [
    { name: "Free", value: data.free || 0 },
    { name: "Pro", value: data.pro || 0 },
    { name: "Enterprise", value: data.enterprise || 0 },
  ].filter((d) => d.value > 0);

  const total = chartData.reduce((a, b) => a + b.value, 0);
  chartData.forEach(
    (d) => (d.percent = total > 0 ? (d.value / total) * 100 : 0),
  );

  if (!total)
    return (
      <div className="h-56 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-800/60 rounded-2xl">
        <p className="text-sm">No user tier data</p>
      </div>
    );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={45}
          dataKey="value"
          paddingAngle={4}
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.name}
              fill={TIER_COLORS[entry.name.toLowerCase()] || "#64748b"}
            />
          ))}
        </Pie>
        <Tooltip content={<PieTooltip />} />
        <Legend
          formatter={(v) => (
            <span className="text-slate-300 text-sm capitalize">{v}</span>
          )}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-sm">{payload[0]?.value} users</p>
    </div>
  );
};

export function IndustryBarChart({ data = [] }) {
  if (!data.length)
    return (
      <div className="h-56 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-800/60 rounded-2xl">
        <p className="text-sm">No industry data yet</p>
      </div>
    );

  const chartData = data.map((d) => ({ name: d.industry, value: d.count }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1e293b"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          dataKey="name"
          type="category"
          width={90}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={<BarTooltip />}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={20}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AITokenTrendChart({ data = [] }) {
  if (!data.length)
    return (
      <div className="h-56 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-800/60 rounded-2xl">
        <p className="text-sm">No AI usage data yet</p>
      </div>
    );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v?.slice(5)}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v)}
        />
        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: "12px",
          }}
          labelStyle={{ color: "#94a3b8", fontSize: "11px" }}
          itemStyle={{ color: "#a78bfa" }}
        />
        <Bar
          dataKey="tokens"
          fill="#8b5cf6"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
          name="Tokens"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
