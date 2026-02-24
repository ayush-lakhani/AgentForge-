import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function UpgradePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/pro-checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.subscription_id && data.razorpay_key) {
        // Open Razorpay checkout modal
        const options = {
          key: data.razorpay_key,
          subscription_id: data.subscription_id,
          name: "Planvix",
          description: "Pro Subscription - ₹2,400/month",
          handler: function (response) {
            // Success - redirect to dashboard
            window.location.href = "/dashboard?success=true&tier=pro";
          },
          prefill: {
            email: user?.email || "",
          },
          theme: {
            color: "#6366F1",
          },
          modal: {
            ondismiss: function () {
              setUpgradeLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        alert("Checkout failed. Please try again.");
        setUpgradeLoading(false);
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Upgrade failed. Please try again.");
      setUpgradeLoading(false);
    }
  };

  // PRO USER - Show success
  if (user?.tier === "pro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative w-28 h-28 mx-auto mb-8 animate-fade-in">
            <div className="w-28 h-28 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex flex-col items-center justify-center shadow-2xl p-4">
              <div className="text-4xl font-black text-white">P</div>
            </div>
            <div className="absolute -inset-2 bg-green-500 rounded-3xl opacity-20 animate-ping"></div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-6 animate-slide-up">
            Welcome to Planvix Pro!
          </h1>
          <div
            className="glass-card p-8 rounded-3xl shadow-2xl border border-green-200 dark:border-green-800 animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            <h3 className="font-bold text-2xl text-green-800 dark:text-green-300 mb-6">
              Your Benefits:
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                <div className="font-bold text-lg mb-2">
                  ⚡ Unlimited Strategies
                </div>
                <div className="text-sm text-green-700 dark:text-green-400">
                  No more 3-strategy limit
                </div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                <div className="font-bold text-lg mb-2">
                  🔍 Real SEO Keywords
                </div>
                <div className="text-sm text-green-700 dark:text-green-400">
                  SerpAPI integration active
                </div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                <div className="font-bold text-lg mb-2">📊 Priority Queue</div>
                <div className="text-sm text-green-700 dark:text-green-400">
                  Skip the waitlist
                </div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                <div className="font-bold text-lg mb-2">
                  📈 Analytics Dashboard
                </div>
                <div className="text-sm text-green-700 dark:text-green-400">
                  Track ROI predictions
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-8 w-full btn-gradient btn-3d py-4 text-lg font-bold"
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FREE USER - Show upgrade
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* HERO SECTION */}
        <div className="text-center mb-20 animate-fade-in">
          {/* Planvix Pro Branding */}
          <div className="text-center mb-8">
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-pulse">
              Planvix Pro
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Unlock Unlimited Growth with AI-powered strategy automation
            </p>
          </div>

          <div
            className="inline-flex items-center bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 
                          px-8 py-4 rounded-2xl text-white font-bold text-lg mb-8 shadow-2xl animate-pulse"
          >
            <span className="text-2xl mr-3">⚡</span>
            You've used all 3 free strategies
          </div>
          <h1
            className="text-5xl md:text-6xl font-black bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 
                         dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent mb-6 leading-tight"
          >
            Unlock{" "}
            <span className="text-transparent bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text">
              Unlimited
            </span>
            Growth
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Creators using Planvix Pro strategies earn{" "}
            <strong>₹4L+ monthly</strong>. Get real SEO keywords, unlimited AI
            agents, and priority processing.
          </p>
        </div>

        {/* PRICING CARDS */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          {/* FREE PLAN */}
          <div
            className="group glass-card p-10 rounded-3xl shadow-2xl border-2 border-gray-100 dark:border-gray-800
                          hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-500 hover:-translate-y-2 animate-slide-up"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl mx-auto mb-6 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors flex items-center justify-center">
                <span className="text-2xl">🆓</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Starter
              </h3>
              <div className="text-4xl font-black text-gray-900 dark:text-white">
                ₹0
                <span className="text-2xl font-normal text-gray-500">/mo</span>
              </div>
            </div>
            <ul className="space-y-4 mb-12 text-lg text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="w-6 h-6 bg-gray-400 rounded-xl mr-4 mt-0.5 flex-shrink-0"></span>
                3 strategies/month
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 bg-gray-400 rounded-xl mr-4 mt-0.5 flex-shrink-0"></span>
                Demo keywords only
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 bg-gray-400 rounded-xl mr-4 mt-0.5 flex-shrink-0"></span>
                Standard processing
              </li>
            </ul>
            <div className="pt-10 border-t-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
              <div className="bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 p-6 rounded-2xl border-2 border-orange-200 dark:border-orange-800">
                <p className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                  Your Current Plan
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  Upgrade for unlimited access
                </p>
              </div>
            </div>
          </div>

          {/* PRO PLAN */}
          <div
            className="group bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-10 rounded-3xl text-white 
                          shadow-2xl border-2 border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-[1.02]
                          relative overflow-hidden animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-white/20 rounded-3xl mx-auto mb-6 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <span className="text-3xl">🚀</span>
                </div>
                <h3 className="text-3xl font-bold mb-3">Pro</h3>
                <div className="text-5xl font-black">
                  ₹2,399<span className="text-3xl font-normal">/month</span>
                </div>
                <p className="text-indigo-100 text-lg opacity-90">
                  Cancel anytime
                </p>
              </div>
              <ul className="space-y-4 mb-12 text-lg">
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-white rounded-xl mr-4 mt-0.5 flex-shrink-0"></span>
                  ✅ Unlimited strategies
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-white rounded-xl mr-4 mt-0.5 flex-shrink-0"></span>
                  ✅ Real SerpAPI keywords
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-white rounded-xl mr-4 mt-0.5 flex-shrink-0"></span>
                  ✅ Priority processing
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-white rounded-xl mr-4 mt-0.5 flex-shrink-0"></span>
                  ✅ Analytics dashboard
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 bg-white rounded-xl mr-4 mt-0.5 flex-shrink-0"></span>
                  ✅ 24/7 priority support
                </li>
              </ul>
              <button
                onClick={handleUpgrade}
                disabled={upgradeLoading}
                className="w-full bg-white text-indigo-600 font-black py-6 px-8 rounded-3xl text-xl shadow-2xl 
                           hover:shadow-3xl transform hover:-translate-y-1 active:scale-[0.98] transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
              >
                {upgradeLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-6 w-6 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Redirecting to checkout...
                  </>
                ) : (
                  <>
                    <span className="text-2xl mr-3">⚡</span>
                    Upgrade to Pro Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* TRUST INDICATORS */}
        <div
          className="text-center space-y-8 animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm">
            <div className="flex items-center glass-card px-6 py-3 rounded-2xl shadow-lg">
              <span className="text-2xl mr-3">🔒</span>
              <span className="text-gray-700 dark:text-gray-300">
                Secure checkout via Stripe
              </span>
            </div>
            <div className="flex items-center glass-card px-6 py-3 rounded-2xl shadow-lg">
              <span className="text-2xl mr-3">📱</span>
              <span className="text-gray-700 dark:text-gray-300">
                Cancel anytime
              </span>
            </div>
            <div className="flex items-center glass-card px-6 py-3 rounded-2xl shadow-lg">
              <span className="text-2xl mr-3">⭐</span>
              <span className="text-gray-700 dark:text-gray-300">
                30-day money-back
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
