import React from 'react';
import { type LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  emoji,
  title,
  description,
  actionText,
  onAction,
  actionIcon: ActionIcon
}) => {
  return (
    <div className="py-12 px-4 text-center rounded-3xl festive-glass border border-amber-500/20 max-w-lg mx-auto space-y-4 shadow-lg my-4">
      {/* Visual Badge */}
      <div className="w-14 h-14 mx-auto rounded-2xl festive-glass-gold flex items-center justify-center text-amber-400 border border-amber-500/30 shadow-md">
        {emoji ? (
          <span className="text-2xl">{emoji}</span>
        ) : (
          <Icon className="w-7 h-7 stroke-[1.75]" />
        )}
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action Button */}
      {actionText && onAction && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold gold-button shadow-md active:scale-95 transition"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            <span>{actionText}</span>
          </button>
        </div>
      )}
    </div>
  );
};
