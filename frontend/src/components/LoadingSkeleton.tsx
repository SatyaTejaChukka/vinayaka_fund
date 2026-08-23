import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5
}) => {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Header bar placeholder */}
      <div className="h-10 bg-slate-800/80 rounded-xl w-full border border-slate-700/40" />

      {/* Row placeholders */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-4"
        >
          {Array.from({ length: columns }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-4 bg-slate-800/90 rounded-lg"
              style={{
                width: `${Math.max(40, 100 - cIdx * 15)}px`,
                opacity: 1 - cIdx * 0.12
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 rounded-3xl festive-glass border border-amber-500/20 space-y-4 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-slate-800/90" />
            <div className="w-16 h-4 rounded-lg bg-slate-800/60" />
          </div>
          <div className="space-y-2">
            <div className="w-24 h-6 rounded-lg bg-slate-700/80" />
            <div className="w-36 h-3.5 rounded-lg bg-slate-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="p-6 sm:p-8 rounded-3xl festive-glass border border-amber-500/30 space-y-6">
        <div className="flex items-center gap-3 border-b border-amber-500/20 pb-4">
          <div className="w-12 h-12 rounded-full bg-slate-800" />
          <div className="space-y-2 flex-1">
            <div className="w-48 h-5 rounded bg-slate-700" />
            <div className="w-64 h-3.5 rounded bg-slate-800" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-10 rounded-xl bg-slate-800/80" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 rounded-xl bg-slate-800/80" />
            <div className="h-10 rounded-xl bg-slate-800/80" />
          </div>
          <div className="h-24 rounded-xl bg-slate-800/80" />
          <div className="h-12 rounded-xl bg-amber-500/20" />
        </div>
      </div>
    </div>
  );
};
