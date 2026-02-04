import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, BarChart3, Clock, Shield, LogOut, Database, Zap, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    
    fetchData(token);
    const interval = setInterval(() => fetchData(token), 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchData = async (token) => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('401');
      
      const dashboardData = await res.json();
      setData(dashboardData);
      setLoading(false);
    } catch (err) {
      localStorage.removeItem('admin_token');
      navigate('/admin-login');
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin-login');
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-700">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                AgentForge Admin
              </h1>
              <p className="text-2xl text-gray-600 dark:text-gray-400">
                Live Analytics • Auto-refresh 30s
              </p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-8 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-white dark:hover:bg-gray-800 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <KPICard 
            icon={<DollarSign className="w-8 h-8 text-white"/>} 
            title="MRR" 
            value={data.revenue.mrr} 
            trend="+12% vs last month"
            color="from-emerald-400 to-emerald-500"
          />
          <KPICard 
            icon={<Users className="w-8 h-8 text-white"/>} 
            title="Pro Users" 
            value={data.revenue.pro_users} 
            trend="↑ Growing"
            color="from-blue-400 to-blue-500"
          />
          <KPICard 
            icon={<BarChart3 className="w-8 h-8 text-white"/>} 
            title="Conversion" 
            value={data.revenue.conversion_rate} 
            trend="Goal: 8%"
            color="from-purple-400 to-purple-500"
          />
          <KPICard 
            icon={<Clock className="w-8 h-8 text-white"/>} 
            title="Strategies Today" 
            value={data.usage.strategies_today} 
            trend={`Total: ${data.usage.total_strategies}`}
            color="from-amber-400 to-amber-500"
          />
        </div>

        {/* System Health */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 mb-12 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <Zap className="w-7 h-7 text-emerald-500" />
            System Health
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <HealthItem 
              label="MongoDB" 
              status={data.system.mongodb_healthy} 
              metric="Connected"
            />
            <HealthItem 
              label="Redis Cache" 
              status={data.system.redis_healthy} 
              metric={data.system.redis_healthy ? "Active" : "Disabled"}
            />
            <HealthItem 
              label="CrewAI Engine" 
              status={data.system.crew_ai_enabled} 
              metric={data.system.crew_ai_enabled ? "Enabled" : "Template Mode"}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            Last updated: {new Date(data.system.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Usage Stats */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <Database className="w-7 h-7 text-blue-500" />
            Platform Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MetricItem 
              label="Total Users" 
              value={data.usage.active_users}
              sublabel="All time"
            />
            <MetricItem 
              label="Total Strategies" 
              value={data.usage.total_strategies}
              sublabel="Generated"
            />
            <MetricItem 
              label="Revenue (MRR)" 
              value={data.revenue.mrr}
              sublabel={`${data.revenue.pro_users} Pro subscribers`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function KPICard({ icon, title, value, trend, color }) {
  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 cursor-pointer hover:shadow-2xl transition-all group">
      <div className="flex items-center justify-between mb-6">
        <div className={`w-16 h-16 bg-gradient-to-r ${color} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-2">{value}</h3>
      <p className="text-xl text-gray-600 dark:text-gray-400 font-semibold">{title}</p>
      <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg mt-2">{trend}</p>
    </div>
  );
}

function HealthItem({ label, status, metric }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/40 dark:bg-gray-700/40 rounded-2xl">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
        status ? 'bg-emerald-500/20' : 'bg-gray-500/20'
      }`}>
        {status ? (
          <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <XCircle className="w-7 h-7 text-gray-600 dark:text-gray-400" />
        )}
      </div>
      <div>
        <p className="font-bold text-gray-900 dark:text-white text-lg">{label}</p>
        <p className={`text-sm font-semibold ${
          status ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'
        }`}>
          {metric}
        </p>
      </div>
    </div>
  );
}

function MetricItem({ label, value, sublabel }) {
  return (
    <div className="text-center p-6 bg-white/40 dark:bg-gray-700/40 rounded-2xl">
      <p className="text-5xl font-black text-gray-900 dark:text-white mb-2">{value}</p>
      <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{label}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{sublabel}</p>
    </div>
  );
}
