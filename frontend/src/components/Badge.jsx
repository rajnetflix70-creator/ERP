import React from 'react';

const BADGE_STYLES = {
  active: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
  done: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
  completed: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
  approved: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
  planning: 'bg-blue-950/80 text-blue-300 border-blue-700/60',
  scheduled: 'bg-blue-950/80 text-blue-300 border-blue-700/60',
  in_progress: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
  pending: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
  review: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
  on_hold: 'bg-slate-800 text-slate-300 border-slate-600',
  rejected: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
  cancelled: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
  neutral: 'bg-slate-800 text-slate-300 border-slate-700'
};

export const Badge = ({
  status,
  children,
  variant,
  size = 'sm',
  dot = false
}) => {
  const key = (variant || status || 'neutral').toString().toLowerCase().replace(/\s+/g, '_');
  const styleClass = BADGE_STYLES[key] || BADGE_STYLES.neutral;

  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md font-semibold border ${sizeClass} ${styleClass} select-none`}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      )}
      {children || status}
    </span>
  );
};

export default Badge;
