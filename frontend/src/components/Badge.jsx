import React from 'react';

const BADGE_MAP = {
  active: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  done: { bg: '#dcfce7', color: '#15803d', label: 'Done' },
  completed: { bg: '#f3e8ff', color: '#7e22ce', label: 'Completed' },
  planning: { bg: '#dbeafe', color: '#1d4ed8', label: 'Planning' },
  scheduled: { bg: '#dbeafe', color: '#1d4ed8', label: 'Scheduled' },
  in_progress: { bg: '#fef3c7', color: '#b45309', label: 'In Progress' },
  pending: { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
  on_hold: { bg: '#f1f5f9', color: '#475569', label: 'On Hold' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' },
  rejected: { bg: '#fee2e2', color: '#b91c1c', label: 'Rejected' },
};

export const Badge = ({ status, children, size = 'sm', dot = false }) => {
  const key = (status || 'active').toLowerCase().replace(/\s+/g, '_');
  const conf = BADGE_MAP[key] || { bg: '#f1f5f9', color: '#475569', label: status };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'xs' ? '1px 6px' : '3px 8px',
        borderRadius: '12px',
        fontSize: size === 'xs' ? '0.7rem' : '0.75rem',
        fontWeight: 600,
        backgroundColor: conf.bg,
        color: conf.color,
        whiteSpace: 'nowrap'
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: conf.color }} />}
      {children || conf.label || status}
    </span>
  );
};

export default Badge;

