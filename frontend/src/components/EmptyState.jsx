import React from 'react';

export const EmptyState = ({
  icon = '📭',
  title = 'No records found',
  description = 'There are no items matching your criteria in the database.',
  actionLabel,
  onAction
}) => {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
        {icon}
      </div>
      <div style={{ maxWidth: '360px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>{title}</h4>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary btn-sm"
          style={{ marginTop: '8px' }}
        >
          <span>＋</span> {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
