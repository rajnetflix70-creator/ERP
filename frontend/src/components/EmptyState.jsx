import React from 'react';

export const EmptyState = ({
  icon = '??',
  title = 'No records found',
  description = 'There are no items matching your criteria in the database.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="py-12 px-4 text-center select-none flex flex-col items-center justify-center space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-2xl shadow-inner">
        {icon}
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-white tracking-wide">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-lg shadow-blue-600/20 transition flex items-center gap-1.5"
        >
          <span>+</span> {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
