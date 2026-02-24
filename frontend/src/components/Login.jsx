import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Zap, Target, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logoSquare from "../assets/branding/logo-square.svg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // Wait a brief moment to ensure token is set before navigation
      // Although useAuth sets it, App.jsx might need a reload if it doesn't listen to storage
      // But for now, just navigate. We might need to fix App.jsx next.
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Side - Hero Content */}
        <div className="hidden md:block space-y-8 animate-slide-right">
          <div className="relative">
            <div className="absolute -left-4 -top-4 w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-xl"></div>
            <h1 className="text-5xl font-black text-gray-900 dark:text-white relative z-10 leading-tight">
              Master Your <br />
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Content Strategy
              </span>
            </h1>
          </div>

          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Join 10,000+ creators using AI agents to dominate their niche.
            Automate research, planning, and execution.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Precision Targeting
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  AI Analyzes your audience deep-dive
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Multi-Agent Teams
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  5 Specialized agents work for you
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Instant ROI
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get strategies that convert today
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-100 dark:border-gray-800 relative overflow-hidden animate-slide-up">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-bl-full"></div>

          <div className="relative z-10">
            {/* Logo and Branding */}
            <div className="flex flex-col items-center mb-6">
              <img
                src={logoSquare}
                alt="Planvix Logo"
                className="h-16 w-16 mb-3"
                style={{
                  filter: "drop-shadow(0 0 12px rgba(99, 102, 241, 0.4))",
                }}
              />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Welcome to Planvix
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI Content Strategy OS
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-2 animate-shake">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-colors"
                  />
                  <span className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="font-semibold text-primary-600 hover:text-primary-500 hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Create free account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-500">
        By signing in, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
