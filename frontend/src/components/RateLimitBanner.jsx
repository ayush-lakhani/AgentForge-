import { useState, useEffect } from 'react';

export default function RateLimitBanner({ error }) {
  const [timeLeft, setTimeLeft] = useState('Loading...');
  
  useEffect(() => {
    if (!error?.reset_at) return;
    
    const updateTimer = () => {
      const diff = error.reset_at * 1000 - Date.now();
      if (diff <= 0) {
        setTimeLeft('Now');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [error?.reset_at]);

  if (!error || error.exceeded !== true) return null;

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm shadow-2xl animate-bounce-in">
      <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 rounded-3xl backdrop-blur-xl border border-white/20">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01m-6.94 4h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Free Limit Reached</h3>
            <p className="mb-1">
              Try again in <strong className="text-2xl font-mono">{timeLeft}</strong>
            </p>
            <p className="text-sm opacity-90">
              {error.used}/{error.limit} strategies used
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-white/30">
          <button 
            className="flex-1 py-3 px-4 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all font-semibold"
            onClick={() => window.location.reload()}
          >
            Wait ⏳
          </button>
          <a 
            href="/upgrade" 
            className="flex-1 bg-white text-gray-900 font-black py-3 px-4 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-center"
          >
            Upgrade ₹499
          </a>
        </div>
      </div>
    </div>
  );
}
