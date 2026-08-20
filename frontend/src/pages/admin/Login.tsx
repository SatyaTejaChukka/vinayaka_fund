import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, UserPlus } from 'lucide-react';
import { adminApi } from '../../services/api';
import { LogoMark } from '../../components/LogoMark';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('admin@vinayaka.org');
  const [password, setPassword] = useState<string>('admin123');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');

      if (isRegister) {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name');
          setLoading(false);
          return;
        }
        await adminApi.register(name.trim(), email.trim(), password);
      } else {
        await adminApi.login(email.trim(), password);
      }

      navigate('/admin/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen festive-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md festive-glass rounded-3xl border border-amber-500/30 p-6 sm:p-8 text-white shadow-2xl space-y-5">
        
        <div className="text-center space-y-2">
          <div className="w-17 h-17 sm:w-18 sm:h-18 flex items-center justify-center diya-pulse mx-auto mb-1">
            <LogoMark className="w-full h-full" />
          </div>
          <h1 className="text-2xl font-extrabold text-gold-gradient">
            {isRegister ? 'Create Committee Account' : 'Committee Admin Login'}
          </h1>
          <p className="text-xs text-slate-300">
            {isRegister
              ? 'Register a new admin account to manage celebration funds & expenses.'
              : 'Sign in to manage celebration funds, verify donations, and track expenses.'}
          </p>
        </div>

        {/* Mode Switcher Segmented Control */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(''); }}
            className={`py-2 rounded-lg transition ${!isRegister ? 'gold-button text-amber-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(''); }}
            className={`py-2 rounded-lg transition ${isRegister ? 'gold-button text-amber-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
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

          {!isRegister && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
              💡 Seed Admin: <span className="font-mono font-bold text-white">admin@vinayaka.org</span> / <span className="font-mono font-bold text-white">admin123</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-3.5 rounded-xl font-extrabold gold-button flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xl active:scale-[0.98] transition disabled:opacity-50 mt-2"
          >
            {loading ? (isRegister ? 'Creating Account...' : 'Authenticating...') : (
              <>
                <span>{isRegister ? 'Register & Enter Dashboard' : 'Enter Admin Dashboard'}</span>
                {isRegister ? <UserPlus className="w-4 h-4 shrink-0" /> : <ArrowRight className="w-4 h-4 shrink-0" />}
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
