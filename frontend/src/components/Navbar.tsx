import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QrCode, Banknote, HeartHandshake, Lock, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  slug?: string;
  onOpenDonateModal?: () => void;
  onOpenCashModal?: () => void;
  onOpenShareModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  slug = 'vinayaka-chavithi-2026',
  onOpenDonateModal,
  onOpenCashModal,
  onOpenShareModal
}) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 w-full festive-glass border-b border-amber-500/20 shadow-xl overflow-hidden">
      
      {/* Top Header Bar: Clean Icon & Title + Admin Link */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        
        {/* Brand Logo & Title */}
        <Link to={`/fund/${slug}`} className="flex items-center gap-2 sm:gap-3 group min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full festive-glass-gold flex items-center justify-center text-amber-400 text-lg sm:text-xl diya-pulse shrink-0">
            🪔
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <span className="font-black text-sm sm:text-xl text-gold-gradient tracking-wide truncate">
              VINAYAKA CHAVITHI
            </span>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
              2026
            </span>
          </div>
        </Link>

        {/* Right Admin Link (Shown only in Admin layout) */}
        {isAdmin && (
          <div className="shrink-0">
            <Link
              to={`/fund/${slug}`}
              target="_blank"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
              <span>Public View ↗</span>
            </Link>
          </div>
        )}

      </div>

      {/* Bottom Action Bar: 3 Dedicated Buttons (Poster, Cash, UPI) */}
      {!isAdmin && (
        <div className="border-t border-amber-500/15 bg-slate-950/60 backdrop-blur-md px-2 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto grid grid-cols-3 gap-1.5 sm:gap-3">
            
            {/* 1. Public Transparency Poster */}
            {onOpenShareModal && (
              <button
                onClick={onOpenShareModal}
                className="py-2 px-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 active:scale-95 transition flex items-center justify-center gap-1 sm:gap-2 text-center"
                title="Generate Transparency QR Poster"
              >
                <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Public Poster QR</span>
                <span className="inline sm:hidden">Poster QR</span>
              </button>
            )}

            {/* 2. Donate by Cash */}
            {onOpenCashModal && (
              <button
                onClick={onOpenCashModal}
                className="py-2 px-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 active:scale-95 transition flex items-center justify-center gap-1 sm:gap-2 text-center"
                title="Donate Cash directly to Committee"
              >
                <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Donate by Cash</span>
                <span className="inline sm:hidden">Donate Cash</span>
              </button>
            )}

            {/* 3. Donate by UPI */}
            {onOpenDonateModal && (
              <button
                onClick={onOpenDonateModal}
                className="py-2 px-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black gold-button active:scale-95 transition flex items-center justify-center gap-1 sm:gap-2 shadow-lg text-center"
                title="Donate via Direct UPI QR / Mobile App"
              >
                <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-slate-950" />
                <span className="hidden sm:inline">Donate by UPI</span>
                <span className="inline sm:hidden">Donate UPI</span>
              </button>
            )}

          </div>
        </div>
      )}

    </header>
  );
};
