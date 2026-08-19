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
    <header className="sticky top-0 z-40 w-full festive-glass border-b border-amber-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to={`/fund/${slug}`} className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full festive-glass-gold flex items-center justify-center text-amber-400 text-2xl diya-pulse">
            🪔
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-gold-gradient tracking-wide">
                VINAYAKA CHAVITHI
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                2026
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
              100% Verified Transparency System
            </p>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {!isAdmin ? (
            <>
              {onOpenShareModal && (
                <button
                  onClick={onOpenShareModal}
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition flex items-center gap-2"
                  title="Generate Transparency QR Poster"
                >
                  <QrCode className="w-4 h-4" />
                  <span className="hidden md:inline">Share Poster QR</span>
                </button>
              )}

              {onOpenDonateModal && (
                <button
                  onClick={onOpenDonateModal}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold gold-button flex items-center gap-2"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Donate via UPI</span>
                </button>
              )}

              <Link
                to="/admin/login"
                className="p-2.5 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800/60 transition"
                title="Committee Admin Login"
              >
                <Lock className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <Link
              to={`/fund/${slug}`}
              target="_blank"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>View Public Page ↗</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};
