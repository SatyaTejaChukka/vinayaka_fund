import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, HeartHandshake, Receipt, Settings, 
  History, LogOut, ExternalLink, ShieldCheck, User as UserIcon, Menu, X, Calendar
} from 'lucide-react';
import { adminApi } from '../../services/api';
import type { User } from '../../types';
import { LogoMark } from '../../components/LogoMark';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await adminApi.getCurrentUser();
        setUser(currentUser);
        try {
          const fund = await adminApi.getCurrentFund();
          setPublicSlug(fund.public_slug);
        } catch {
          setPublicSlug(null);
        }
      } catch {
        adminApi.logout();
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Close mobile menu whenever location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    adminApi.logout();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen festive-bg text-white flex items-center justify-center p-4">
        <div className="text-amber-300 font-bold text-sm animate-pulse flex items-center gap-2">
          <LogoMark className="w-5 h-5" /> Verifying Admin Access...
        </div>
      </div>
    );
  }

  const navLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Event Schedule & Banner', path: '/admin/schedule', icon: <Calendar className="w-4 h-4" /> },
    { name: 'Donations & Verify', path: '/admin/donations', icon: <HeartHandshake className="w-4 h-4" /> },
    { name: 'Expense Tracker', path: '/admin/expenses', icon: <Receipt className="w-4 h-4" /> },
    { name: 'Fund Settings', path: '/admin/fund-settings', icon: <Settings className="w-4 h-4" /> },
    { name: 'Audit Trail', path: '/admin/audit-logs', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen festive-bg text-slate-100 flex flex-col md:flex-row">
      
      {/* Admin Top Navbar / Sidebar */}
      <aside className="w-full md:w-64 md:h-screen md:sticky md:top-0 md:overflow-y-auto festive-glass border-b md:border-b-0 md:border-r border-amber-500/20 p-3.5 md:p-5 flex flex-col justify-between shrink-0 z-40">
        
        {/* Top Header Bar for Brand + Mobile Toggle */}
        <div className="flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center diya-pulse shrink-0">
              <LogoMark className="w-full h-full" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-gold-gradient tracking-tight">
                VINAYAKA ADMIN
              </h2>
              <span className="text-[10px] text-amber-300/80 font-medium block -mt-0.5">
                Committee Control
              </span>
            </div>
          </Link>

          {/* Mobile Collapsible Toggle Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-amber-300 hover:text-white bg-slate-900/80 border border-amber-500/30 transition flex items-center gap-1 text-xs font-bold"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <>
                  <X className="w-5 h-5 text-rose-400" />
                  <span className="text-[11px]">Close</span>
                </>
              ) : (
                <>
                  <Menu className="w-5 h-5 text-amber-400" />
                  <span className="text-[11px]">Menu</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Links - Collapsible on Mobile, Persistent on Desktop */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block mt-3 md:mt-6 space-y-3`}>
          
          <nav className="flex flex-col gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-amber-500/20">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${
                    active
                      ? 'gold-button text-amber-950 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent hover:border-slate-700'
                  }`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Actions Footer */}
          <div className="pt-3 border-t border-amber-500/20 space-y-2.5">
            <a
              href={publicSlug ? `/fund/${publicSlug}` : '/admin/fund-settings'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition"
            >
              <span>{publicSlug ? 'Public Page View' : 'Create Public Slug'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 truncate">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-x-hidden min-w-0">
        <header className="px-4 py-3 sm:px-6 sm:py-4 festive-glass border-b border-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1 self-start sm:self-auto shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Admin Authenticated</span>
          </span>
        </header>

        <main className="p-3.5 sm:p-6 max-w-7xl w-full space-y-6">
          {children}
        </main>
      </div>

    </div>
  );
};
