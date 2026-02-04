import { useState, useEffect } from 'react';

export default function LiveUsageCounter() {
  const [usage, setUsage] = useState({ used: 0, limit: 10, resetIn: '5h 0m', tier: 'free' });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const res = await fetch('/api/user/usage', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setUsage(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Usage fetch error:', error);
      }
    };
    
    fetchUsage();
    const interval = setInterval(fetchUsage, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;
  if (usage.tier === 'pro') return null; // Don't show for Pro users

  const progress = (usage.used / usage.limit) * 100;
  const isHigh = progress > 70;
  const isCritical = progress >= 90;
  
  return (
    <div className={`p-6 rounded-3xl shadow-xl border-4 transition-all duration-500 ${
      isCritical ? 'border-red-400 bg-gradient-to-r from-red-50 to-orange-50 animate-pulse' :
      isHigh ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-yellow-50' :
      progress > 40 ? 'border-yellow-400 bg-yellow-50' :
      'border-emerald-400 bg-emerald-50'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl text-3xl font-black transition-all ${
            isCritical ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white scale-110' :
            isHigh ? 'bg-gradient-to-br from-orange-500 to-yellow-500 text-white' :
            'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
          }`}>
            {usage.used}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Free Strategies</h3>
            <p className="text-xl text-gray-600">
              Resets in <span className="font-mono font-bold text-emerald-600">{usage.resetIn}</span>
            </p>
          </div>
        </div>
        {isHigh && (
          <a 
            href="/upgrade" 
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all whitespace-nowrap"
          >
            Go Unlimited
          </a>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-white/50 h-4 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div 
          className={`h-4 rounded-2xl transition-all duration-1000 ease-out shadow-inner ${
            isCritical ? 'bg-gradient-to-r from-red-500 to-orange-500' :
            isHigh ? 'bg-gradient-to-r from-orange-500 to-yellow-500' :
            progress > 40 ? 'bg-gradient-to-r from-yellow-500 to-emerald-500' :
            'bg-gradient-to-r from-emerald-500 to-teal-500'
          }`} 
          style={{ width: `${progress}%` }} 
        />
      </div>
      
      {/* Usage Text */}
      <div className="flex justify-between items-center mt-3">
        <p className="text-sm font-semibold text-gray-600">
          {usage.used} of {usage.limit} used ({usage.progress}%)
        </p>
        {isCritical && (
          <p className="text-sm font-bold text-red-600 animate-pulse">
            🔥 Almost at limit!
          </p>
        )}
      </div>
    </div>
  );
}
