import React, { useEffect, useState } from 'react';

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
  const [animatedPercentage, setAnimatedPercentage] = useState<number>(0);
  const [displayPercentage, setDisplayPercentage] = useState<number>(0);

  useEffect(() => {
    // Reset to 0% and start realistic running journey after 400ms delay
    setAnimatedPercentage(0);
    setDisplayPercentage(0);

    const startTimer = setTimeout(() => {
      setAnimatedPercentage(percentage);

      // Synchronize percentage counter numbers in real-time as Ganesha runs over 2400ms
      const duration = 2400;
      const startTime = performance.now();

      const updateCounter = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Cubic ease out matching the CSS transition curve
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.round(easeProgress * percentage * 10) / 10;
        setDisplayPercentage(currentVal);

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          setDisplayPercentage(percentage);
        }
      };

      requestAnimationFrame(updateCounter);
    }, 400);

    return () => clearTimeout(startTimer);
  }, [percentage]);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const currentFillPercent = Math.min(100, Math.max(0, animatedPercentage));
  const runnerLeftPos = Math.min(96, Math.max(4, currentFillPercent));

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
            <span className="text-2xl sm:text-3xl font-black text-gold-gradient font-mono">
              {displayPercentage}%
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

      {/* Progress Bar Container with Ganesha on Mooshika Runner */}
      <div className="relative pt-14 sm:pt-16">
        
        {/* Animated Ganesha + Mooshika Mouse Runner Icon */}
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-[2400ms] cubic-bezier(0.25,1,0.5,1) z-10 pointer-events-none"
          style={{ left: `${runnerLeftPos}%` }}
        >
          <div className="w-14 h-14 sm:w-20 sm:h-20 mooshika-runner-anim victory-pulse select-none">
            <img
              src="/progressBar.png"
              alt="Lord Ganesha riding Mooshika Mouse"
              className="w-full h-full object-contain filter drop-shadow-[0_4px_14px_rgba(255,183,3,0.95)]"
            />
          </div>
          {/* Leading Edge Glow Pin */}
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_15px_#ffb703] -mt-1" />
        </div>

        {/* Outer Bar */}
        <div className="w-full h-4 sm:h-5 rounded-full bg-slate-950/90 p-1 border border-amber-500/30 relative overflow-hidden shadow-inner">
          {/* Animated Glow Fill Bar */}
          <div
            className="h-full rounded-full transition-all duration-[2400ms] cubic-bezier(0.25,1,0.5,1) progress-bar-glow"
            style={{
              width: `${Math.min(100, Math.max(3, currentFillPercent))}%`,
              background: 'linear-gradient(90deg, #ffb703 0%, #fb8500 70%, #e63946 100%)'
            }}
          />
        </div>
      </div>

      {onBarClick && (
        <p className="text-[11px] sm:text-xs text-amber-300/80 font-medium text-right mt-2 hover:underline">
          Click bar to view all verified donations ➔
        </p>
      )}
    </div>
  );
};
