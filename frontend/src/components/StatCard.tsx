import React from 'react';

interface StatCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'amber' | 'emerald' | 'rose' | 'indigo' | 'purple';
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  subtitle,
  icon,
  variant = 'amber',
  badge
}) => {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const variantStyles = {
    amber: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
    emerald: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
    rose: 'border-rose-500/30 text-rose-400 bg-rose-500/5',
    indigo: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5',
    purple: 'border-purple-500/30 text-purple-400 bg-purple-500/5'
  };

  return (
    <div className={`p-4 sm:p-6 rounded-2xl festive-glass border ${variantStyles[variant]} transition-all duration-200 hover:transform hover:-translate-y-1 shadow-lg relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-xs sm:text-sm font-semibold text-slate-300 tracking-wide truncate pr-1">{title}</span>
        <div className={`p-2 sm:p-2.5 rounded-xl festive-glass shrink-0 ${variantStyles[variant]}`}>
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-1 sm:mt-2 gap-1 flex-wrap">
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white truncate">
          {formatINR(amount)}
        </h3>
        {badge && (
          <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-[11px] sm:text-xs text-slate-400 font-medium flex items-center gap-1 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
