import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { useDashboard } from '../hooks';

export default function AdminLogin() {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAdminSecret, fetchDashboardStats, loading } = useDashboard();

  const login = async () => {
    if (!secret.trim()) {
      setError('Please enter admin secret');
      return;
    }

    setError('');
    
    try {
      // Set the admin secret in localStorage
      setAdminSecret(secret);
      
      // Try to fetch dashboard stats to verify the secret
      await fetchDashboardStats();
      
      // If successful, navigate to admin dashboard
      navigate('/admin');
    } catch (err) {
      setError(err.message || '❌ Invalid Admin Secret');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-12 w-full max-w-md shadow-3xl animate-float-in">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Shield className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4">Admin Portal</h1>
          <p className="text-white/80 text-xl">Secret key access only</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-200 text-center">
            {error}
          </div>
        )}

        <div className="relative mb-8">
          <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter admin secret key"
            className="w-full pl-14 pr-6 py-6 bg-white/20 backdrop-blur-sm border border-white/30 rounded-3xl text-white placeholder-white/70 text-lg focus:outline-none focus:border-emerald-500 transition-all"
            onKeyPress={(e) => e.key === 'Enter' && login()}
            disabled={loading}
          />
        </div>

        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black py-6 px-8 rounded-3xl text-xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '🔄 Validating...' : '🚀 Enter Dashboard'}
        </button>

        <p className="text-white/60 text-sm text-center mt-6">
          Separate from user login system
        </p>
        <p className="text-white/40 text-xs text-center mt-2">
          Default: planvix-admin-2026-change-now
        </p>
      </div>
    </div>
  );
}
