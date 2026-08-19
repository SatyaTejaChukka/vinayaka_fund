import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, HeartHandshake, Receipt, Settings, 
  History, LogOut, ExternalLink, ShieldCheck, User as UserIcon
} from 'lucide-react';
import { adminApi } from '../../services/api';
import type { User } from '../../types';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await adminApi.getCurrentUser();
        setUser(currentUser);
      } catch {
        adminApi.logout();
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    adminApi.logout();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen festive-bg text-white flex items-center justify-center p-4">
        <div className="text-amber-300 font-bold text-sm animate-pulse flex items-center gap-2">
          <span>🪔</span> Verifying Admin Access...
        </div>
      </div>
    );
  }

  const navLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Donations & Verify', path: '/admin/donations', icon: <HeartHandshake className="w-4 h-4" /> },
    { name: 'Expense Tracker', path: '/admin/expenses', icon: <Receipt className="w-4 h-4" /> },
    { name: 'Fund Settings', path: '/admin/fund-settings', icon: <Settings className="w-4 h-4" /> },
    { name: 'Audit Trail', path: '/admin/audit-logs', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen festive-bg text-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 md:h-screen md:sticky md:top-0 md:overflow-y-auto festive-glass border-r border-amber-500/20 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          
          {/* Admin Header Brand */}
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full festive-glass-gold flex items-center justify-center text-xl diya-pulse">
              🪔
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-gold-gradient">
                VINAYAKA ADMIN
              </h2>
              <span className="text-[10px] text-amber-300/80 font-medium">
                Committee Portal
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
                    active
                      ? 'gold-button text-amber-950 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

        </div>

        {/* User Info & Actions */}
        <div className="pt-6 border-t border-amber-500/10 space-y-3">
          <a
            href="/fund/vinayaka-chavithi-2026"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition"
          >
            <span>Public Page View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 truncate">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-x-hidden">
        <header className="p-6 festive-glass border-b border-amber-500/10 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-white">
            {title}
          </h1>
          <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Admin Authenticated
          </span>
        </header>

        <main className="p-6 max-w-7xl w-full space-y-6">
          {children}
        </main>
      </div>

    </div>
  );
};
