import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicFund } from './pages/public/PublicFund';
import { AdminLogin } from './pages/admin/Login';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminDonations } from './pages/admin/Donations';
import { AdminExpenses } from './pages/admin/Expenses';
import { FundSettings } from './pages/admin/FundSettings';
import { AuditLogs } from './pages/admin/AuditLogs';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/fund/vinayaka-chavithi-2026" replace />} />
        <Route path="/fund/:slug" element={<PublicFund />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/donations" element={<AdminDonations />} />
        <Route path="/admin/expenses" element={<AdminExpenses />} />
        <Route path="/admin/fund-settings" element={<FundSettings />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/fund/vinayaka-chavithi-2026" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
