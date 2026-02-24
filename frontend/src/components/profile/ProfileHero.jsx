import {
  Sparkles,
  Calendar,
  Mail,
  Zap,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { safeDate } from "../../utils/dateUtils";

export default function ProfileHero({ data, loading }) {
  if (loading || !data) {
    return (
      <div className="glass-card p-8 rounded-3xl mb-8 animate-pulse">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-3">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const {
    name,
    email,
    tier,
    member_since,
    total_strategies,
    tokens_used_month,
    next_billing_date,
  } = data;

  return (
    <div className="relative overflow-hidden glass-card p-8 rounded-3xl mb-8 group transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left: User Identity */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary-600 to-accent-600 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-24 h-24 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-white text-4xl font-black shadow-2xl">
              {(name || email || "U")[0].toUpperCase()}
            </div>
            {tier === "pro" && (
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 shadow-lg border-2 border-slate-900">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <div className="text-center sm:text-left">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                {name}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  tier === "pro"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {tier} Tier
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 dark:text-slate-400 text-sm">
                <Mail className="w-4 h-4" />
                {email}
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 dark:text-slate-400 text-xs">
                <Calendar className="w-4 h-4" />
                Member since {safeDate(member_since, "monthYear")}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full lg:w-auto">
          <div className="glass-card bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">
              Total Strategies
            </p>
            <p className="text-2xl font-black text-primary-600 dark:text-primary-400">
              {total_strategies}
            </p>
          </div>
          <div className="glass-card bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">
              Tokens Used
            </p>
            <p className="text-2xl font-black text-accent-600 dark:text-accent-400">
              {(tokens_used_month / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="glass-card bg-white/5 p-4 rounded-2xl border border-white/10 text-center col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">
              Next Billing
            </p>
            <p className="text-lg font-black text-slate-700 dark:text-slate-300">
              {next_billing_date}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
