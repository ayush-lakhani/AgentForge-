import { useState, useEffect } from 'react';
import { X, Zap, Infinity, HeadphonesIcon, TrendingUp } from 'lucide-react';

export default function UpgradeModal({ usageCount, onClose, onUpgrade }) {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    // Trigger at 2/3 usage
    if (usageCount >= 2) {
      setShow(true);
    }
    
    // Exit intent detection
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !show && usageCount >= 1) {
        setShow(true);
      }
    };
    
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [usageCount, show]);

  const handleClose = () => {
    setShow(false);
    if (onClose) onClose();
  };

  const handleUpgradeClick = () => {
    if (onUpgrade) onUpgrade();
  };

  if (!show) return null;

  const strategiesLeft = 3 - usageCount;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl w-full max-w-lg shadow-2xl animate-float-in relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-all"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Header */}
        <div className="p-8 text-center border-b border-white/10 dark:border-gray-700/30">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-400/20 to-amber-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
            {strategiesLeft === 1 ? '🚨 LAST FREE STRATEGY' : '⚠️ ALMOST OUT OF STRATEGIES'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
            You've used {usageCount}/3 free strategies this month
          </p>
        </div>

        {/* Benefits Section */}
        <div className="p-8">
          <div className="grid gap-4 mb-8">
            <div className="flex items-center gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 backdrop-blur-sm rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Infinity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Unlimited Strategies</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">No more limits, create anytime</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 backdrop-blur-sm rounded-2xl border border-blue-100 dark:border-blue-800/30">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <HeadphonesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Priority Support</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Instant help when you need it</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50/50 dark:bg-purple-900/10 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-purple-800/30">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Advanced Analytics</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Track your content performance</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleUpgradeClick}
              className="group relative bg-gradient-to-r from-emerald-500 via-emerald-600 to-amber-500 text-white font-black py-4 px-6 rounded-2xl text-base shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-200 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-amber-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                UPGRADE ₹499/mo
              </span>
            </button>
            <button 
              onClick={handleClose}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-4 px-6 rounded-2xl text-base hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
            >
              {strategiesLeft > 0 ? `Continue Free (${strategiesLeft} left)` : 'Maybe Later'}
            </button>
          </div>

          {/* Trust Badge */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
            ✨ Join 1,000+ creators growing their audience
          </p>
        </div>
      </div>
    </div>
  );
}
