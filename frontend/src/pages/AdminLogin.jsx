import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminAPI } from "../api/adminAPI";
import AuthLayout from "../components/auth/AuthLayout";
import AuthCard from "../components/auth/AuthCard";
import AnimatedButton from "../components/auth/AnimatedButton";

export default function AdminLogin() {
  const [secret, setSecret] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { adminLogin } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!secret.trim()) {
      setError("Please enter admin secret");
      return;
    }

    try {
      setError("");
      setLoading(true);

      // Store secret first
      localStorage.setItem("adminSecret", secret);

      // Validate secret with backend
      await adminAPI.get("/api/admin/dashboard");

      // Redirect safely
      navigate("/admin", { replace: true });
    } catch (err) {
      localStorage.removeItem("adminSecret");
      setError("Invalid admin secret");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout variant="center" backgroundVariant="admin">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Security Grid Overlay - Subtler */}
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,white_70%,transparent_100%)] pointer-events-none" />

        {/* Secure System Badge */}
        <div className="flex justify-center mb-8 relative z-10">
          <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center space-x-3 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
              System Interface secured
            </span>
          </div>
        </div>

        <AuthCard className="border-emerald-500/20 relative z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-emerald-500/30 group relative">
              <Shield className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-500 relative z-10" />
              <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Admin Gateway
            </h1>
            <p className="text-gray-500 text-xs mt-2 font-medium uppercase tracking-widest opacity-80">
              Authorized Personnel Access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
                System Secret Key
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-400 group-focus-within:scale-110 transition-all" />
                <input
                  type={show ? "text" : "password"}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-950/50 border border-white/5 rounded-xl text-white placeholder:text-gray-800 focus:outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-emerald-400 transition-colors"
                >
                  {show ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <AnimatedButton
                type="submit"
                loading={loading}
                className="!from-emerald-600 !via-teal-600 !to-emerald-600 shadow-emerald-500/20"
              >
                <div
                  className={`transition-transform duration-500 ${loading ? "scale-0" : "scale-100 flex items-center space-x-2"}`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Secure Access</span>
                </div>
              </AnimatedButton>
            </div>
          </form>

          <div className="mt-10 pt-6 border-t border-white/5 flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-3 text-[10px] text-gray-600 uppercase tracking-[0.2em] font-black">
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
              <span>Session Encrypted</span>
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
            </div>
          </div>
        </AuthCard>

        {/* Security Note */}
        <p className="mt-8 text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest opacity-60">
          Trace ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
        </p>
      </div>
    </AuthLayout>
  );
}
