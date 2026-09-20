import React from 'react';

export const StatCard = ({
  label,
  value,
  subtext,
  badgeText,
  color = 'blue',
  icon,
  onClick
}) => {
  const accentBorders = {
    blue: '#2563eb',
    emerald: '#10b981',
    amber: '#f59e0b',
    purple: '#8b5cf6',
    rose: '#ef4444'
  };

  const badgeBg = {
    blue: '#eff6ff',
    emerald: '#ecfdf5',
    amber: '#fffbeb',
    purple: '#f5f3ff',
    rose: '#fff1f2'
  };

  const badgeColor = {
    blue: '#1d4ed8',
    emerald: '#047857',
    amber: '#b45309',
    purple: '#6d28d9',
    rose: '#be123c'
  };

  return (
    <div
      onClick={onClick}
      className="stat-card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderBottom: `3px solid ${accentBorders[color] || '#2563eb'}`,
        cursor: onClick ? 'pointer' : 'default',
        padding: '16px 20px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        {badgeText && (
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: badgeBg[color] || '#eff6ff',
              color: badgeColor[color] || '#1d4ed8'
            }}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0 6px' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', lineHeight: 1 }}>
          {value !== undefined && value !== null ? value : '—'}
        </span>
        {icon && <span style={{ fontSize: '1.2rem' }}>{icon}</span>}
      </div>

      {subtext && (
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
          {subtext}
        </div>
      )}
    </div>
  );
};

export default StatCard;
