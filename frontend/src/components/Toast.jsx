import React from 'react';

export const ToastItem = ({ id, type = 'info', title, message, onClose }) => {
  const icons = {
    success: '?',
    error: '?',
    warning: '??',
    info: '??'
  };

  const bgStyles = {
    success: 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100',
    error: 'bg-rose-950/95 border-rose-500/50 text-rose-100',
    warning: 'bg-amber-950/95 border-amber-500/50 text-amber-100',
    info: 'bg-slate-900/95 border-blue-500/50 text-blue-100'
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur max-w-md w-full animate-slideIn transition-all duration-200 ${bgStyles[type] || bgStyles.info}`}
      style={{
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        animation: 'slideInToast 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <span className="text-xl flex-shrink-0">{icons[type] || icons.info}</span>
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-bold text-sm tracking-wide mb-0.5">{title}</h5>}
        <p className="text-xs leading-relaxed opacity-90 break-words">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-slate-400 hover:text-white p-1 rounded transition text-xs flex-shrink-0"
        aria-label="Close"
      >
        ?
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, onClose }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-auto"
      style={{ maxWidth: 'calc(100vw - 32px)' }}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};

export default ToastContainer;
