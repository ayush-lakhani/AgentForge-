import { Zap, CreditCard, UserPlus, Sparkles, Clock } from "lucide-react";
import { safeDate } from "../../utils/dateUtils";

export default function ActivityTimeline({ activity, loading }) {
  if (loading || !activity) {
    return (
      <div className="glass-card p-6 rounded-3xl h-[500px] animate-pulse bg-slate-100 dark:bg-slate-800" />
    );
  }

  const getIcon = (type) => {
    switch (type) {
      case "strategy_created":
        return <Sparkles className="w-4 h-4 text-primary-600" />;
      case "billing_update":
        return <CreditCard className="w-4 h-4 text-accent-600" />;
      case "user_signup":
        return <UserPlus className="w-4 h-4 text-emerald-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBg = (type) => {
    switch (type) {
      case "strategy_created":
        return "bg-primary-100 dark:bg-primary-900/30";
      case "billing_update":
        return "bg-accent-100 dark:bg-accent-900/30";
      case "user_signup":
        return "bg-emerald-100 dark:bg-emerald-900/30";
      default:
        return "bg-slate-100 dark:bg-slate-800";
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl h-[500px] flex flex-col group transition-all hover:shadow-2xl hover:shadow-slate-500/5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <Zap className="w-5 h-5 text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Recent Activity
          </h3>
        </div>
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          Real-time Feed
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <Clock className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-4" />
            <p className="text-slate-500 text-sm">
              No recent activity detected.
            </p>
          </div>
        ) : (
          activity.map((item, idx) => (
            <div key={idx} className="relative pl-8 pb-1 group/item">
              {/* Timeline Line */}
              {idx !== activity.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-slate-100 dark:bg-slate-800 group-hover/item:bg-primary-500/20 transition-colors" />
              )}

              {/* Timeline Dot/Icon */}
              <div
                className={`absolute left-0 top-0 w-8 h-8 rounded-full ${getBg(item.type)} flex items-center justify-center z-10 shadow-sm border-2 border-white dark:border-slate-900 transition-transform group-hover/item:scale-110`}
              >
                {getIcon(item.type)}
              </div>

              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-tighter mb-0.5">
                  {safeDate(item.timestamp, "relative")}
                </p>
                <div className="glass-card bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 group-hover/item:border-primary-500/20 transition-all">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {item.title}
                  </h4>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
