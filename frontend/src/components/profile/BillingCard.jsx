import { CreditCard, Rocket, CheckCircle2, ArrowUpRight } from "lucide-react";

export default function BillingCard({ billing, loading }) {
  if (loading || !billing) {
    return (
      <div className="glass-card p-6 rounded-3xl h-[500px] animate-pulse bg-slate-100 dark:bg-slate-800" />
    );
  }

  const { plan, monthly_limit, used_this_month, renewal_date } = billing;
  const usagePercent = Math.min(
    100,
    Math.round((used_this_month / monthly_limit) * 100),
  );
  const isNearLimit = usagePercent > 80;

  return (
    <div className="glass-card p-6 rounded-3xl h-[500px] flex flex-col group transition-all hover:shadow-2xl hover:shadow-accent-500/5">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-xl">
            <CreditCard className="w-5 h-5 text-accent-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Billing Intelligence
          </h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            plan === "Pro"
              ? "bg-emerald-500 text-white"
              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          {plan} Plan
        </span>
      </div>

      <div className="space-y-8 flex-1">
        {/* Usage Progress */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-1">
                Monthly Capacity
              </p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                {used_this_month}{" "}
                <span className="text-slate-400 text-lg font-bold">
                  / {monthly_limit}
                </span>
              </h4>
            </div>
            <p
              className={`text-xs font-black ${isNearLimit ? "text-rose-500" : "text-emerald-500"}`}
            >
              {usagePercent}% Used
            </p>
          </div>

          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1 border border-slate-200 dark:border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isNearLimit
                  ? "bg-gradient-to-r from-rose-500 to-orange-500"
                  : "bg-gradient-to-r from-primary-500 to-accent-500"
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          {isNearLimit && (
            <p className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1">
              <Rocket className="w-3 h-3" /> Approaching strategy limit.
              Consider upgrading.
            </p>
          )}
        </div>

        {/* Plan Comparison Snippet */}
        <div className="glass-card bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <h5 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase mb-4">
            Plan Benefits
          </h5>
          <ul className="space-y-3">
            {[
              { label: "5-Agent Strategy Engine", active: true },
              { label: "Real-time Analytics Feed", active: true },
              { label: "Bulk Export & History", active: plan === "Pro" },
              { label: "Custom Brand Personas", active: plan === "Pro" },
            ].map((feature, i) => (
              <li
                key={i}
                className={`flex items-center gap-2 text-xs font-bold ${feature.active ? "text-slate-700 dark:text-slate-300" : "text-slate-400 opacity-50 line-through"}`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${feature.active ? "text-emerald-500" : "text-slate-400"}`}
                />
                {feature.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button className="w-full mt-6 py-4 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all group/btn shadow-xl shadow-slate-900/10 dark:shadow-white/5">
        {plan === "Pro" ? "Manage Subscription" : "Upgrade to Pro"}
        <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
}
