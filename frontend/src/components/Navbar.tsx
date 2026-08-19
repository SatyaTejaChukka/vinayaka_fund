import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, HeartHandshake, LayoutDashboard, QrCode, Lock } from 'lucide-react';

interface NavbarProps {
  slug?: string;
  onOpenDonateModal?: () => void;
  onOpenShareModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  slug = 'vinayaka-chavithi-2026',
  onOpenDonateModal,
  onOpenShareModal
}) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 w-full festive-glass border-b border-amber-500/20 shadow-lg overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-20 flex items-center justify-between gap-2 w-full">
        
        {/* Brand Logo */}
        <Link to={`/fund/${slug}`} className="flex items-center gap-1.5 sm:gap-3 group min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full festive-glass-gold flex items-center justify-center text-amber-400 text-base sm:text-2xl diya-pulse shrink-0">
            🪔
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-extrabold text-xs sm:text-xl text-gold-gradient tracking-wide truncate">
                VINAYAKA CHAVITHI
              </span>
              <span className="hidden sm:inline-block text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                2026
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium hidden md:flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
              100% Verified Transparency System
            </p>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {!isAdmin ? (
            <>
              {onOpenShareModal && (
                <button
                  onClick={onOpenShareModal}
                  className="p-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition flex items-center gap-1.5"
                  title="Generate Transparency QR Poster"
                >
                  <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden md:inline">Share Poster QR</span>
                </button>
              )}

              {onOpenDonateModal && (
                <button
                  onClick={onOpenDonateModal}
                  className="px-2.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold gold-button flex items-center gap-1 shadow-md"
                >
                  <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Donate via UPI</span>
                  <span className="inline sm:hidden">Donate</span>
                </button>
              )}

              <Link
                to="/admin/login"
                className="p-1.5 sm:p-2.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800/60 transition"
                title="Committee Admin Login"
              >
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </>
          ) : (
            <Link
              to={`/fund/${slug}`}
              target="_blank"
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">View Public Page ↗</span>
              <span className="inline sm:hidden">Public ↗</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};
