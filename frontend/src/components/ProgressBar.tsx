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
      className={`p-6 rounded-2xl festive-glass border border-amber-500/30 ${onBarClick ? 'cursor-pointer hover:border-amber-400/50' : ''} transition shadow-xl`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
            Fund Collection Progress
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {formatINR(collected)}
            </span>
            <span className="text-sm font-semibold text-slate-400">
              of {formatINR(target)} target
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-gold-gradient">
            {percentage}%
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Live
          </span>
        </div>
      </div>

      {/* Outer Bar */}
      <div className="w-full h-5 rounded-full bg-slate-900/90 p-1 border border-amber-500/20 relative overflow-hidden">
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
        <p className="text-xs text-amber-300/80 font-medium text-right mt-2 hover:underline">
          Click bar to view all verified donations ➔
        </p>
      )}
    </div>
  );
};
