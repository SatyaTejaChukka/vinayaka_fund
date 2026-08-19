import React from 'react';

interface ProgressBarProps {
  collected: number;
  target: number;
  percentage: number;
  onBarClick?: () => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  collected,
  target,
  percentage,
  onBarClick
}) => {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div 
      onClick={onBarClick}
      className={`p-4 sm:p-6 rounded-2xl festive-glass border border-amber-500/30 ${onBarClick ? 'cursor-pointer hover:border-amber-400/50' : ''} transition shadow-xl`}
    >
      <div className="flex flex-row items-end justify-between mb-2.5 sm:mb-3 gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-amber-400">
              Fund Collection Progress
            </span>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gold-gradient">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Right side Amount (Collected / Target) */}
        <div className="text-right shrink-0">
          <span className="text-[10px] sm:text-xs text-slate-400 block font-medium">
            Raised of Target
          </span>
          <div className="flex items-baseline justify-end gap-1 sm:gap-1.5 mt-0.5">
            <span className="text-lg sm:text-2xl font-bold text-slate-300">
              {formatINR(collected)}
            </span>
            <span className="text-lg sm:text-xl font-bold text-amber-400">
              / {formatINR(target)}
            </span>
          </div>
        </div>
      </div>

      {/* Outer Bar */}
      <div className="w-full h-4 sm:h-5 rounded-full bg-slate-900/90 p-1 border border-amber-500/20 relative overflow-hidden">
        {/* Animated Glow Fill Bar */}
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out progress-bar-glow"
          style={{
            width: `${Math.min(100, Math.max(5, percentage))}%`,
            background: 'linear-gradient(90deg, #ffb703 0%, #fb8500 70%, #e63946 100%)'
          }}
        />
      </div>

      {onBarClick && (
        <p className="text-[11px] sm:text-xs text-amber-300/80 font-medium text-right mt-2 hover:underline">
          Click bar to view all verified donations ➔
        </p>
      )}
    </div>
  );
};
