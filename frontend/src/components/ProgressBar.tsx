import React, { useEffect, useState } from 'react';

export interface ProgressBarProps {
  title?: string;
  badgeText?: string;
  badgeVariant?: 'emerald' | 'rose' | 'amber' | 'purple';
  collected: number;
  target: number;
  percentage: number;
  labelRight?: string;
  barColor?: 'amber' | 'rose' | 'emerald' | 'purple';
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  icon?: React.ReactNode;
  onBarClick?: () => void;
  showMooshika?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  title = 'Fund Collection Progress',
  badgeText = 'Live',
  badgeVariant = 'emerald',
  collected,
  target,
  percentage,
  labelRight = 'Raised of Target',
  barColor = 'amber',
  footerLeft,
  footerRight,
  icon,
  onBarClick,
  showMooshika = true
}) => {
  const safeCollected = Number.isFinite(collected) ? collected : 0;
  const safeTarget = Number.isFinite(target) ? target : 0;
  const safePercentage = Number.isFinite(percentage) ? percentage : 0;

  const [animatedPercentage, setAnimatedPercentage] = useState<number>(0);
  const [displayPercentage, setDisplayPercentage] = useState<number>(0);

  useEffect(() => {
    // Reset to 0% and start realistic running journey after 300ms delay
    setAnimatedPercentage(0);
    setDisplayPercentage(0);

    const startTimer = setTimeout(() => {
      setAnimatedPercentage(safePercentage);

      // Synchronize percentage counter numbers in real-time as Ganesha runs over 2400ms
      const duration = 2400;
      const startTime = performance.now();

      const updateCounter = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Cubic ease out matching the CSS transition curve
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.round(easeProgress * safePercentage * 10) / 10;
        setDisplayPercentage(currentVal);

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          setDisplayPercentage(safePercentage);
        }
      };

      requestAnimationFrame(updateCounter);
    }, 300);

    return () => clearTimeout(startTimer);
  }, [safePercentage]);

  const formatINR = (val: number) => {
    const safeVal = Number.isFinite(val) ? val : 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(safeVal);
  };

  const currentFillPercent = Math.min(100, Math.max(0, animatedPercentage));
  const runnerLeftPos = Math.min(96, Math.max(4, currentFillPercent));

  const getGradient = () => {
    switch (barColor) {
      case 'rose':
        return 'linear-gradient(90deg, #f43f5e 0%, #e11d48 70%, #9f1239 100%)';
      case 'emerald':
        return 'linear-gradient(90deg, #10b981 0%, #059669 70%, #047857 100%)';
      case 'purple':
        return 'linear-gradient(90deg, #a855f7 0%, #7e22ce 70%, #581c87 100%)';
      case 'amber':
      default:
        return 'linear-gradient(90deg, #ffb703 0%, #fb8500 70%, #e63946 100%)';
    }
  };

  const getBadgeStyle = () => {
    switch (badgeVariant) {
      case 'rose':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'purple':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'emerald':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div 
      onClick={onBarClick}
      className={`p-5 sm:p-7 rounded-3xl festive-glass border border-amber-500/30 ${
        onBarClick ? 'cursor-pointer hover:border-amber-400/50' : ''
      } transition duration-300 shadow-2xl space-y-4`}
    >
      {/* Top Header Row */}
      <div className="flex flex-row items-end justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {icon}
            <span className="text-xs sm:text-sm uppercase font-extrabold tracking-wider text-amber-300 truncate">
              {title}
            </span>
            {badgeText && (
              <span className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold border ${getBadgeStyle()}`}>
                {badgeText}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-3xl sm:text-4xl font-black text-gold-gradient font-mono">
              {displayPercentage}%
            </span>
          </div>
        </div>

        {/* Right side Amount (Collected / Target) */}
        <div className="text-right shrink-0">
          <span className="text-[10px] sm:text-xs text-slate-400 block font-medium">
            {labelRight}
          </span>
          <div className="flex items-baseline justify-end gap-1.5 sm:gap-2 mt-0.5">
            <span className="text-lg sm:text-2xl font-black text-white">
              {formatINR(safeCollected)}
            </span>
            <span className="text-base sm:text-lg font-bold text-amber-400">
              / {formatINR(safeTarget)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar Container with Ganesha on Mooshika Runner */}
      <div className="relative pt-14 sm:pt-16">
        
        {/* Animated Ganesha + Mooshika Mouse Runner Icon */}
        {showMooshika && (
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-[2400ms] cubic-bezier(0.25,1,0.5,1) z-10 pointer-events-none"
            style={{ left: `${runnerLeftPos}%` }}
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 mooshika-runner-anim victory-pulse select-none">
              <img
                src="/progressBar.png"
                alt="Lord Ganesha riding Mooshika Mouse"
                className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(255,183,3,0.95)]"
              />
            </div>
            {/* Leading Edge Glow Pin */}
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_15px_#ffb703] -mt-1" />
          </div>
        )}

        {/* Outer Bar */}
        <div className="w-full h-4 sm:h-5 rounded-full bg-slate-950/90 p-1 border border-amber-500/30 relative overflow-hidden shadow-inner">
          {/* Animated Glow Fill Bar */}
          <div
            className="h-full rounded-full transition-all duration-[2400ms] cubic-bezier(0.25,1,0.5,1) progress-bar-glow"
            style={{
              width: `${currentFillPercent}%`,
              background: getGradient()
            }}
          />
        </div>
      </div>

      {/* Optional Custom Footer */}
      {(footerLeft || footerRight) && (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-amber-500/10">
          <div>{footerLeft}</div>
          <div>{footerRight}</div>
        </div>
      )}

      {onBarClick && !footerRight && (
        <p className="text-[11px] sm:text-xs text-amber-300/80 font-medium text-right hover:underline">
          Click bar to view all verified donations ➔
        </p>
      )}
    </div>
  );
};
