import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, Users, DollarSign, Search, Filter, Download, 
  Zap, LogOut, Shield, Settings, TrendingUp, Activity, BarChart3, Database, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EnterpriseAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('overview');
  const navigate = useNavigate();

  // Fetch all data
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    fetchStats(token);
    fetchUsers(token);
    fetchRevenue(token);
    fetchActivity(token);
    fetchAlerts(token);

    // Auto-refresh stats every 30s
    const interval = setInterval(() => {
        fetchStats(token);
        fetchActivity(token);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHeaders = (token) => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchStats = async (token) => {
    try {
        const res = await fetch('/api/admin/dashboard', getHeaders(token));
        if (res.status === 401) {
            localStorage.removeItem('admin_token');
            navigate('/admin-login');
            return;
        }
        const data = await res.json();
        setStats(data);
    } catch (e) { console.error("Stats fetch error:", e); }
  };

  const fetchUsers = async (token) => {
    try {
        const res = await fetch(`/api/admin/users?search=${search}&limit=20`, getHeaders(token));
        const data = await res.json();
        setUsers(data.users || []);
    } catch (e) { console.error("Users fetch error:", e); }
  };

  const fetchRevenue = async (token) => {
    try {
        const res = await fetch('/api/admin/revenue-breakdown', getHeaders(token));
        const data = await res.json();
        setRevenueData(data.industries || []);
    } catch (e) { console.error("Revenue fetch error:", e); }
  };
  
  const fetchActivity = async (token) => {
    try {
        const res = await fetch('/api/admin/activity', getHeaders(token));
        const data = await res.json();
        setActivities(data.activities || []);
    } catch (e) { console.error("Activity fetch error:", e); }
  };

  const fetchAlerts = async (token) => {
    try {
        const res = await fetch('/api/admin/alerts', getHeaders(token));
        const data = await res.json();
        setAlerts(data.alerts || []);
    } catch (e) { console.error("Alerts fetch error:", e); }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin-login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white font-sans">
      <header className="border-b border-slate-800/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                  Planvix Admin <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 ml-2">PRO</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all border border-slate-700/50 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-800/80 sticky top-[72px] backdrop-blur-xl z-10 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex gap-2 bg-slate-800/50 rounded-2xl p-1 max-w-2xl">
            {['overview', 'users', 'revenue', 'activity'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex-1 text-sm ${
                  tab === t
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {tab === 'overview' && <OverviewTab alerts={alerts} stats={stats} />}
        {tab === 'users' && <UsersTab users={users} onSearch={(v) => { setSearch(v); fetchUsers(localStorage.getItem('admin_token')); }} />}
        {tab === 'revenue' && <RevenueTab data={revenueData} />}
        {tab === 'activity' && <ActivityTab activities={activities} />}
      </div>
    </div>
  );
};

const OverviewTab = ({ alerts, stats }) => (
  <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
    {alerts.length > 0 && <AlertsSection alerts={alerts} />}

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard 
        title="MRR" 
        value={stats?.revenue?.mrr || '₹0'} 
        change="+12% (Simulated)" 
        color="emerald" 
        icon={<DollarSign className="w-6 h-6" />} 
      />
      <KPICard 
        title="Pro Users" 
        value={stats?.revenue?.pro_users?.toString() || '0'} 
        change="Active" 
        color="blue" 
        icon={<Users className="w-6 h-6" />} 
      />
      <KPICard 
        title="Active Strategies" 
        value={stats?.usage?.active_strategies?.toLocaleString() || '0'} 
        change="Live Now" 
        color="emerald" 
        icon={<Zap className="w-6 h-6" />} 
      />
      <KPICard 
        title="Lifetime Generated" 
        value={stats?.usage?.total_strategies?.toLocaleString() || '0'} 
        change={`+${stats?.usage?.strategies_today || 0} today`} 
        color="orange" 
        icon={<Activity className="w-6 h-6" />} 
      />
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
            <CardHeader><CardTitle className="text-slate-200 flex gap-2"><Filter className="w-5 h-5"/> Conversion Funnel</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <FunnelStep value={stats?.usage?.active_users || 0} label="Total Users" rate="100%" />
                    <FunnelStep value={stats?.usage?.total_strategies || 0} label="Strategies" rate="Engagement" />
                    <FunnelStep value={stats?.revenue?.pro_users || 0} label="Pro Users" rate={stats?.revenue?.conversion_rate || '0%'} color="emerald" />
                </div>
            </CardContent>
        </Card>
        <SystemHealth stats={stats} />
    </div>
  </div>
);

const UsersTab = ({ users, onSearch }) => (
  <div className="max-w-7xl mx-auto px-8 py-8">
    <div className="flex gap-4 mb-8 items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all text-slate-200 placeholder:text-slate-500"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-medium border border-slate-700/50 flex items-center gap-2 transition-all">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
    </div>
    <UserManagementTable users={users} />
  </div>
);

const RevenueTab = ({ data }) => (
  <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <RevenueHeatmap data={data} />
        </div>
        <div>
             <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl h-full">
                <CardHeader>
                    <CardTitle className="text-slate-200">Revenue Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <p className="text-sm text-slate-400 mb-1">Top Performing Industry</p>
                        <p className="text-xl font-bold text-white">{data.length > 0 ? data[0]._id : "N/A"}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  </div>
);

const ActivityTab = ({ activities }) => (
  <div className="max-w-7xl mx-auto px-8 py-8">
    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
        <CardHeader><CardTitle className="text-slate-200 flex gap-2"><Activity className="w-5 h-5"/> Live Activity Feed</CardTitle></CardHeader>
        <CardContent>
            <div className="space-y-0 divide-y divide-slate-800/50">
             {activities.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No recent activity found.</div>
             ) : (
                 activities.map((act, i) => (
                    <ActivityItem key={i} user={act.user} action={act.action} time={act.time} details={act.details} />
                 ))
             )}
            </div>
        </CardContent>
    </Card>
  </div>
);

const KPICard = ({ title, value, change, color, icon }) => (
  <div className="group p-6 rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-950/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none`}></div>
    <div className="flex items-start justify-between mb-6 relative">
      <div className={`w-14 h-14 bg-gradient-to-br from-${color}-500/20 to-${color}-600/10 rounded-2xl flex items-center justify-center shadow-inner border border-${color}-500/20 group-hover:scale-110 transition-all text-${color}-400`}>
        {icon}
      </div>
       <span className={`px-2 py-1 rounded-lg text-xs font-bold bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
        {change}
      </span>
    </div>
    <h3 className="text-3xl font-bold text-white mb-1 relative z-10">{value}</h3>
    <p className="text-slate-400 font-medium text-sm relative z-10">{title}</p>
  </div>
);

const UserManagementTable = ({ users }) => (
  <div className="bg-slate-900/50 border border-slate-800/50 rounded-3xl backdrop-blur-xl overflow-hidden shadow-2xl">
    <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-800/50 bg-slate-900/80">
          <th className="p-6 font-semibold text-slate-300 text-sm uppercase tracking-wider">User / Email</th>
          <th className="p-6 font-semibold text-slate-300 text-sm uppercase tracking-wider">Tier</th>
          <th className="p-6 font-semibold text-slate-300 text-sm uppercase tracking-wider">Strategies</th>
          <th className="p-6 font-semibold text-slate-300 text-sm uppercase tracking-wider">Joined</th>
          <th className="p-6 text-right font-semibold text-slate-300 text-sm uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/50">
        {users.length === 0 ? (
            <tr><td colSpan="5" className="p-8 text-center text-slate-500">No users found matching your search.</td></tr>
        ) : (
            users.map((user, i) => (
            <UserRow key={i} user={user} />
            ))
        )}
      </tbody>
    </table>
    </div>
  </div>
);

const UserRow = ({ user }) => (
  <tr className="hover:bg-slate-800/30 transition-all group">
    <td className="p-6">
        <div className="font-medium text-slate-200">{user.email?.split('@')[0]}</div>
        <div className="text-xs text-slate-500">{user.email}</div>
    </td>
    <td className="p-6">
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
        user.tier === 'pro' 
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      }`}>
        {user.tier?.toUpperCase() || 'FREE'}
      </span>
    </td>
    <td className="p-6 text-slate-300 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-slate-500" />
        {user.strategies_count || 0}
    </td>
    <td className="p-6 text-slate-400 text-sm font-mono">
        {new Date(user.created_at).toLocaleDateString()}
    </td>
    <td className="p-6 text-right">
      <div className="flex gap-2 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
        <button className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all" title="Upgrade User">
          <Zap className="w-4 h-4" />
        </button>
        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all" title="Manage User">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
);

const RevenueHeatmap = ({ data }) => (
    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
        <CardHeader>
             <CardTitle className="text-slate-200 flex gap-2"><DollarSign className="w-5 h-5"/> Revenue by Industry</CardTitle>
        </CardHeader>
        <CardContent>
            {data.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-800/50 rounded-xl">
                    No revenue data available yet.
                </div>
            ) : (
                <div className="space-y-4">
                    {data.map((item, i) => (
                        <div key={i} className="group">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-200 font-medium">{item._id}</span>
                                <span className="text-slate-400">{item.count} users</span>
                            </div>
                            <div className="h-3 w-full bg-slate-800/50 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 group-hover:brightness-110" 
                                    style={{ width: `${Math.min((item.count / 10) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
    </Card>
);

const AlertsSection = ({ alerts }) => (
    <div className="grid grid-cols-1 gap-4">
        {alerts.map((alert, i) => (
             <div key={i} className={`p-4 rounded-2xl border flex items-center gap-4 ${
                 alert.type === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'
             }`}>
                <div className={`p-2 rounded-full ${
                    alert.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                    <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                    <h4 className={`font-bold ${
                         alert.type === 'error' ? 'text-red-400' : 'text-amber-400'
                    }`}>{alert.title}</h4>
                    <p className="text-slate-300 text-sm">{alert.message}</p>
                </div>
                {alert.impact && (
                     <div className="ml-auto px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 text-sm font-mono text-slate-300">
                         Impact: {alert.impact}
                     </div>
                )}
             </div>
        ))}
    </div>
);

const FunnelStep = ({ value, label, rate, color = 'slate' }) => (
  <div className="flex items-center justify-between py-4 px-6 bg-slate-800/30 rounded-2xl border-l-4 border-slate-700 hover:border-slate-500 transition-all hover:bg-slate-800/40">
    <div className="flex items-center gap-4">
        <div className="p-2 bg-slate-900/50 rounded-lg text-slate-400 border border-slate-800">
            {label === 'Visitors' && <Users className="w-4 h-4"/>}
            {label === 'Signups' && <LogOut className="w-4 h-4 rotate-180"/>} 
            {label === 'Strategies' && <Zap className="w-4 h-4"/>}
            {label === 'Pro Users' && <DollarSign className="w-4 h-4 text-emerald-400"/>}
        </div>
        <div>
            <p className="font-mono text-xl font-bold text-white">{value.toLocaleString()}</p>
            <p className="text-xs text-slate-400 uppercase tracking-widest">{label}</p>
        </div>
    </div>
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
         color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-300'
    }`}>
      {rate}
    </span>
  </div>
);

const SystemHealth = ({ stats }) => (
    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
        <CardHeader><CardTitle className="text-slate-200 flex gap-2"><Database className="w-5 h-5"/> System Health</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <HealthItem 
                label="Local MongoDB" 
                status={stats?.system?.mongodb_healthy ? "healthy" : "error"} 
                latency="< 1ms" 
            />
            <HealthItem 
                label="Redis Cache" 
                status={stats?.system?.redis_healthy ? "healthy" : "warning"} 
                metric={stats?.system?.redis_healthy ? "Active" : "Disabled"} 
            />
            <HealthItem 
                label="CrewAI Agents" 
                status={stats?.system?.crew_ai_enabled ? "healthy" : "warning"} 
                metric={stats?.system?.crew_ai_enabled ? "Combined" : "Template Mode"} 
            />
            <HealthItem 
                label="Last Updated" 
                status="healthy" 
                metric={new Date().toLocaleTimeString()} 
            />
        </CardContent>
    </Card>
);

const HealthItem = ({ label, status, latency, metric }) => {
  const colors = {
    healthy: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    warning: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    error: 'border-red-500/20 bg-red-500/5 text-red-400'
  };
  
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border group hover:shadow-lg transition-all ${colors[status]}`}>
      <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}/>
          <span className="font-medium text-slate-200">{label}</span>
      </div>
      <span className="text-xs font-mono opacity-80 bg-slate-900/30 px-2 py-1 rounded-lg">{latency || metric}</span>
    </div>
  );
};

const ActivityItem = ({ user, action, time, details }) => (
  <div className="flex items-center justify-between py-4 px-6 hover:bg-slate-800/30 rounded-2xl transition-all group">
    <div className="flex items-center gap-4 truncate">
      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 group-hover:border-slate-600 transition-colors">
        <Users className="w-5 h-5 text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
            <p className="font-medium text-slate-200 truncate">{user?.split('@')[0]}</p>
            <span className="text-xs text-slate-500 hidden sm:inline-block">• {user}</span>
        </div>
        <p className="text-sm text-slate-400 truncate flex items-center gap-2">
            {action} 
            {details && <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-xs border border-slate-700">{details}</span>}
        </p>
      </div>
    </div>
    <span className="text-xs text-slate-500 font-mono whitespace-nowrap flex items-center gap-1">
        <Clock className="w-3 h-3" /> {time}
    </span>
  </div>
);

export default EnterpriseAdminDashboard;
