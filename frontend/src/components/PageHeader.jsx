import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  icon,
  tag,
  actions,
  breadcrumbs
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
      <div className="space-y-1">
        {breadcrumbs && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mb-1">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span>/</span>}
                <span className={i === breadcrumbs.length - 1 ? 'text-slate-300 font-semibold' : ''}>
                  {b}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2.5 flex-wrap">
          {icon && <span className="text-xl">{icon}</span>}
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          {tag && (
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {tag}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
