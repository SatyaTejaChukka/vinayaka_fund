import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { PublicFund } from './pages/public/PublicFund';
import { AdminLogin } from './pages/admin/Login';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminDonations } from './pages/admin/Donations';
import { AdminExpenses } from './pages/admin/Expenses';
import { FundSettings } from './pages/admin/FundSettings';
import { AuditLogs } from './pages/admin/AuditLogs';

const DEMO_SLUG = 'vinayaka-chavithi-2026';

const CampaignLanding: React.FC = () => {
  const navigate = useNavigate();
  const [slug, setSlug] = useState('');

  const handleOpenCampaign = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
    if (cleanSlug) navigate('/fund/' + cleanSlug);
  };

  return (
    <div className="min-h-screen festive-bg text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg festive-glass rounded-3xl border border-amber-500/30 p-6 sm:p-10 text-center shadow-2xl space-y-6">
        <div className="space-y-2">
          <p className="text-amber-300 text-xs font-bold uppercase tracking-[0.2em]">Community Transparency Portal</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gold-gradient">Open a Campaign</h1>
          <p className="text-sm text-slate-300">Enter the campaign slug from the public link to view that department’s donations and expenses.</p>
        </div>

        <form onSubmit={handleOpenCampaign} className="space-y-3 text-left">
          <label htmlFor="campaign-slug" className="text-xs font-bold text-slate-300">Campaign slug</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="campaign-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="for example: department-a-2026"
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
            />
            <button type="submit" disabled={!slug.trim()} className="px-5 py-3 rounded-xl font-bold gold-button text-amber-950 disabled:opacity-50 disabled:cursor-not-allowed">
              Open Campaign
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
          <Link to={'/fund/' + DEMO_SLUG} className="text-amber-300 hover:text-white transition">View demo campaign</Link>
          <span className="hidden sm:inline text-slate-600">•</span>
          <Link to="/admin/login" className="text-slate-300 hover:text-amber-300 transition">Committee admin login</Link>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<CampaignLanding />} />
            <Route path="/fund/:slug" element={<PublicFund />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/donations" element={<AdminDonations />} />
            <Route path="/admin/expenses" element={<AdminExpenses />} />
            <Route path="/admin/fund-settings" element={<FundSettings />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </ToastProvider>
  );
};

export default App;
