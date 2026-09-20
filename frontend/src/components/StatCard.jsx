import React from 'react';

const ACCENT_COLORS = {
  blue: { bar: 'bg-blue-500', pill: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  emerald: { bar: 'bg-emerald-500', pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  amber: { bar: 'bg-amber-500', pill: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  purple: { bar: 'bg-purple-500', pill: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  rose: { bar: 'bg-rose-500', pill: 'bg-rose-500/10 text-rose-400 border-rose-500/30' }
};

export const StatCard = ({
  label,
  value,
  subtext,
  badgeText,
  color = 'blue',
  icon,
  onClick
}) => {
  const scheme = ACCENT_COLORS[color] || ACCENT_COLORS.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden group hover:border-slate-700 transition select-none ${
        onClick ? 'cursor-pointer hover:bg-slate-800/40' : ''
      }`}
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {badgeText && (
          <span className={`text-xs font-mono px-2 py-0.5 rounded border font-semibold ${scheme.pill}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-black font-mono text-white tracking-tight">
          {value !== undefined && value !== null ? value : '—'}
        </span>
        {icon && <span className="text-lg opacity-80">{icon}</span>}
      </div>

      {subtext && (
        <div className="mt-2 text-[11px] text-slate-400 font-medium truncate">
          {subtext}
        </div>
      )}

      {/* Colored bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${scheme.bar}`} />
    </div>
  );
};

export default StatCard;
