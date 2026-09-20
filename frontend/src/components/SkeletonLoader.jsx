import React from 'react';

export const SkeletonRow = ({ cols = 6 }) => {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-4 bg-slate-800 rounded w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
};

export const SkeletonCards = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 animate-pulse">
          <div className="h-3 bg-slate-800 rounded w-24" />
          <div className="h-7 bg-slate-800 rounded w-16" />
          <div className="h-2 bg-slate-800 rounded w-32" />
        </div>
      ))}
    </div>
  );
};

export default { SkeletonRow, SkeletonCards };
