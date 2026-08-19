import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { adminApi } from '../../services/api';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('admin@vinayaka.org');
  const [password, setPassword] = useState<string>('admin123');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      await adminApi.login(email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Invalid email or password credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen festive-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md festive-glass rounded-3xl border border-amber-500/30 p-8 text-white shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full festive-glass-gold flex items-center justify-center text-3xl diya-pulse mx-auto mb-2">
            🪔
          </div>
          <h1 className="text-2xl font-extrabold text-gold-gradient">
            Committee Admin Login
          </h1>
          <p className="text-xs text-slate-300">
            Sign in to manage celebration funds, verify donations, and track expenses.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vinayaka.org"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-sm"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
            💡 Default Seed Admin: <span className="font-mono font-bold text-white">admin@vinayaka.org</span> / <span className="font-mono font-bold text-white">admin123</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-extrabold gold-button flex items-center justify-center gap-2 text-sm shadow-xl mt-2"
          >
            {loading ? 'Authenticating...' : (
              <>
                <span>Enter Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <a href="/fund/vinayaka-chavithi-2026" className="text-xs text-slate-400 hover:text-amber-300 transition">
            ← Return to Public Transparency Page
          </a>
        </div>

      </div>
    </div>
  );
};
