import React from 'react';
import Modal from './Modal';

export const ConfirmDialog = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
  isDestructive = true,
  loading = false,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      icon={isDestructive ? '??' : '?'}
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-300 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-800 justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="btn btn-secondary text-xs px-4 py-2"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'} text-xs px-4 py-2 flex items-center gap-1.5`}
          >
            {loading && <span className="animate-spin text-xs">?</span>}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
