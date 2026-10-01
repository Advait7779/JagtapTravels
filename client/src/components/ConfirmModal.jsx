import React, { useEffect } from 'react';
import { Trash, Warning, X } from '@phosphor-icons/react';

/**
 * ConfirmModal
 * A sleek, high-fidelity confirmation modal matching the Jagtap Travels CRM theme.
 * Replaces native browser window.confirm() dialogs.
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  heading,
  message = 'Are you sure you want to delete this record?',
  confirmText = 'Delete Record',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning'
  loading = false,
}) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 relative text-left font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-navy-950 text-white flex items-center justify-between border-b border-navy-900">
          <div className="flex items-center gap-2">
            <h3 id="confirm-modal-title" className="text-sm sm:text-base font-bold text-white tracking-tight">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            title="Close dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 border shadow-xs ${
                isDanger
                  ? 'bg-rose-100/80 border-rose-200 text-rose-600'
                  : 'bg-amber-100/80 border-amber-200 text-amber-700'
              }`}
            >
              {isDanger ? (
                <Trash size={22} weight="bold" />
              ) : (
                <Warning size={22} weight="bold" />
              )}
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {heading || 'Attention Required'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 rounded-md transition-colors shadow-2xs disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white rounded-md shadow-xs transition-all disabled:opacity-60 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 border border-rose-700'
                : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 border border-amber-700'
            }`}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing…</span>
              </>
            ) : (
              <>
                {isDanger && <Trash size={15} weight="bold" />}
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
