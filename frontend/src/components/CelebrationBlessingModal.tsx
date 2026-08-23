import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Award, GraduationCap } from 'lucide-react';
import { LogoMark } from './LogoMark';

interface BlessingData {
  donorName: string;
  amount: number;
  studentYear: string;
  refId?: string;
}

interface CelebrationBlessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BlessingData | null;
}

export const CelebrationBlessingModal: React.FC<CelebrationBlessingModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger full festive confetti celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ffb703', '#fb8500', '#10b981', '#ffd166']
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 70,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 }
        });
        confetti({
          particleCount: 70,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 }
        });
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const yearLower = (data.studentYear || '').toLowerCase();
  const isFinalYear = yearLower.includes('4') || yearLower.includes('iv') || yearLower.includes('final');
  const isJuniorYear =
    yearLower.includes('1') ||
    yearLower.includes('2') ||
    yearLower.includes('3') ||
    yearLower.includes('i') ||
    yearLower.includes('ii') ||
    yearLower.includes('iii');

  // Custom Telugu blessing message matching user's exact specification
  let mainBlessing = 'Ee sem lo neevi anni subjects pass ayipothaai';
  let blessingSub = 'May Lord Ganesha bless your studies with 100% all-clear pass results & great CGPA!';

  if (isFinalYear) {
    mainBlessing = 'Ee sem lo neevi anni subjects pass ayipoyi, neeku placement lo manchi job vastaadhi';
    blessingSub = 'May Lord Ganesha shower blessings on your final year exams and grant you your dream placement job! 🎓💼';
  } else if (!isJuniorYear && data.studentYear) {
    mainBlessing = 'Ganesha anugraham tho meeku, mee kutumbaniki subham & manchi vijayam kaluguthaayi';
    blessingSub = 'May Lord Ganesha shower prosperity, good health, and success upon you! ';
  }

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg festive-glass rounded-3xl border-2 border-amber-500/50 p-6 sm:p-8 text-white shadow-2xl space-y-6 text-center transform scale-100 transition-all duration-300">
        
        {/* Animated Celebration Icon Header */}
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl festive-glass-gold flex items-center justify-center border-2 border-amber-400/60 shadow-[0_0_30px_rgba(255,183,3,0.6)] victory-pulse select-none">
            <LogoMark className="w-14 h-14 diya-pulse" />
          </div>
        </div>

        {/* Header Title */}
        <div className="space-y-1">
          <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-widest text-amber-300 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 inline-block">
            🙏 Ganapathi Bappa Morya! 🙏
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gold-gradient tracking-tight">
            Thank You, {data.donorName}!
          </h2>
        </div>

        {/* Special Telugu Blessing Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-amber-500/20 via-slate-900/90 to-slate-900/90 border border-amber-400/50 shadow-inner space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Special Student Blessing</span>
          </div>

          <h3 className="text-base sm:text-xl font-extrabold text-amber-200 leading-snug tracking-normal px-2">
            "{mainBlessing}"
          </h3>

          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            {blessingSub}
          </p>
        </div>

        {/* Submission Details Pill */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300 flex items-center justify-between gap-2 text-left">
          <div className="space-y-0.5">
            <p className="text-white font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Donation Submitted: <strong className="text-amber-400 font-extrabold">{formatINR(data.amount)}</strong></span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              Status: <span className="text-amber-300 font-bold">Pending Committee Verification</span>
            </p>
          </div>
          {data.studentYear && (
            <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
              🎓 {data.studentYear}
            </span>
          )}
        </div>

        {/* Action Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="w-full py-3.5 rounded-xl font-black gold-button text-sm sm:text-base shadow-xl active:scale-95 transition flex items-center justify-center gap-2"
        >
          <Award className="w-4 h-4 text-amber-950" />
          <span>Jai Ganesha! (Back to Portal)</span>
        </button>

      </div>
    </div>
  );
};
