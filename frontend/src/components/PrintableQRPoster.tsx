import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Copy, CheckCircle2 } from 'lucide-react';
import type { FundSummary } from '../types';
import { LogoMark } from './LogoMark';

interface PrintableQRPosterProps {
  fund: FundSummary;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableQRPoster: React.FC<PrintableQRPosterProps> = ({
  fund,
  isOpen,
  onClose
}) => {
  const [copiedLink, setCopiedLink] = React.useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const publicUrl = `${window.location.origin}/fund/${fund.public_slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-md max-h-[90vh] sm:max-h-[85vh] flex flex-col festive-glass rounded-3xl border border-amber-500/30 p-4 sm:p-5 text-white shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:p-0 print:bg-white print:text-black">
        
        {/* Screen Controls Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between pb-3 mb-3 border-b border-amber-500/20 bg-slate-950/90 -mt-1 -mx-1 px-2 pt-1 rounded-t-2xl backdrop-blur-md print:hidden">
          <h3 className="text-base sm:text-lg font-bold text-gold-gradient flex items-center gap-2">
            <LogoMark className="w-5 h-5" />
            <span>Public Transparency Poster</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-300 hover:text-white rounded-full bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 transition shrink-0"
            title="Close Poster"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 flex-1 space-y-3 print:overflow-visible">

        {/* Printable Poster Container */}
        <div 
          ref={posterRef}
          className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border border-amber-500/40 text-center shadow-inner print:bg-white print:text-black print:border-2 print:border-black"
        >
          <div className="w-20 h-20 mx-auto mb-2 diya-pulse">
            <LogoMark className="w-full h-full" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-amber-400 uppercase print:text-amber-600">
            {fund.name}
          </h1>
          <p className="text-xs font-bold text-amber-200 uppercase tracking-widest mt-0.5 print:text-slate-700">
            Community Fund Transparency Portal
          </p>

          <div className="my-5 p-4 bg-white rounded-2xl inline-block shadow-lg border-4 border-amber-400 print:border-black">
            <QRCodeSVG
              value={publicUrl}
              size={200}
              level="H"
              includeMargin={false}
            />
          </div>

          <p className="text-xs font-bold text-slate-200 print:text-slate-800">
            Scan QR Code with camera or phone to view live verified transactions & expenses
          </p>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-amber-500/20 text-center text-xs print:border-black">
            <div className="p-2 rounded-xl bg-slate-900/60 print:bg-slate-100">
              <span className="block text-[10px] text-slate-400 font-medium">Collected</span>
              <span className="font-extrabold text-amber-300 print:text-black">{formatINR(fund.total_collected)}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/60 print:bg-slate-100">
              <span className="block text-[10px] text-slate-400 font-medium">Spent</span>
              <span className="font-extrabold text-rose-400 print:text-black">{formatINR(fund.total_spent)}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/60 print:bg-slate-100">
              <span className="block text-[10px] text-slate-400 font-medium">Balance</span>
              <span className="font-extrabold text-emerald-400 print:text-black">{formatINR(fund.available_balance)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons for Screen */}
        <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-5 print:hidden">
          <button
            onClick={handleCopyLink}
            className="w-1/2 py-2.5 sm:py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 active:scale-95 transition text-slate-200 text-xs sm:text-sm flex items-center justify-center gap-1.5"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="w-1/2 py-2.5 sm:py-3 rounded-xl font-bold gold-button active:scale-95 transition text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Print Flyer</span>
          </button>
        </div>
        </div>

      </div>
    </div>
  );
};
