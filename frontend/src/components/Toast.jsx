import React from 'react';

export const ToastItem = ({ id, type = 'info', title, message, onClose }) => {
  const colors = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: '✅' },
    error: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '❌' },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '⚠️' },
    info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: 'ℹ️' }
  };
  const conf = colors[type] || colors.info;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 16px',
        borderRadius: '8px',
        border: `1px solid ${conf.border}`,
        backgroundColor: conf.bg,
        color: conf.text,
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        minWidth: '280px',
        maxWidth: '420px'
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>{conf.icon}</span>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px' }}>{title}</div>}
        <div style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{message}</div>
      </div>
      <button
        onClick={() => onClose(id)}
        style={{ background: 'none', border: 'none', color: conf.text, cursor: 'pointer', fontSize: '0.85rem', opacity: 0.7 }}
      >
        ✕
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, onClose }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};

export default ToastContainer;

