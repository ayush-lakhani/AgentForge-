import { TrendingUp, Zap } from 'lucide-react';

export default function ProfileWidget({ usageCount, totalAllowed = 3, tier = 'free', onUpgrade }) {
  const percentage = (usageCount / totalAllowed) * 100;
  const isCritical = usageCount >= 2;
  const strategiesLeft = totalAllowed - usageCount;
  
  // Don't show for Pro users
  if (tier === 'pro') {
    return (
      <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border-2 border-emerald-200 dark:border-emerald-800 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-xl text-gray-900 dark:text-white">
                Pro Plan Active
              </p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                ∞ Unlimited Strategies
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`w-full p-4 rounded-2xl transition-all duration-500 ${
      isCritical 
        ? 'bg-gradient-to-r from-rose-500/10 to-amber-500/10 border-rose-200 dark:border-rose-800 border-2 backdrop-blur-sm' 
        : 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/30 dark:border-gray-700/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isCritical 
              ? 'bg-gradient-to-br from-rose-400 to-amber-500' 
              : 'bg-gradient-to-br from-emerald-400 to-emerald-600'
          }`}>
            {isCritical ? (
              <svg className="w-7 h-7 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <TrendingUp className="w-7 h-7 text-white" />
            )}
          </div>
          <div>
            <p className="font-bold text-xl text-gray-900 dark:text-white">
              {usageCount}/{totalAllowed} Free Strategies Used
            </p>
            <p className={`text-sm font-semibold ${
              isCritical 
                ? 'text-rose-600 dark:text-rose-400' 
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {isCritical 
                ? '⏳ Last chance this month!' 
                : strategiesLeft === 0 
                  ? '🎯 All used! Upgrade for more' 
                  : `✨ ${strategiesLeft} strategies remaining`
              }
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {isCritical || strategiesLeft === 0 ? (
            <button 
              onClick={onUpgrade}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Upgrade Pro
            </button>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              +{strategiesLeft} left
            </span>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2 backdrop-blur-sm overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              isCritical 
                ? 'bg-gradient-to-r from-rose-400 to-amber-500' 
                : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
            }`}
            style={{width: `${percentage}%`}}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {percentage.toFixed(0)}% used this month • Resets on 1st
        </p>
      </div>
    </div>
  );
}
