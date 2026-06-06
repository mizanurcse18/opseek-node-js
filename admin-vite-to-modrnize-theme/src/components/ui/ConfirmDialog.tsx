import React, { useEffect } from 'react';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmDialogDetail {
  label: string;
  value: string | React.ReactNode;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  details?: ConfirmDialogDetail[];
  infoMessage?: string;
  infoType?: 'info' | 'warning' | 'error';
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  details,
  infoMessage,
  infoType = 'info',
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  loading = false,
  icon,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const infoColors = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      dot: 'bg-blue-500',
      text: 'text-blue-700',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      dot: 'bg-amber-500',
      text: 'text-amber-700',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      dot: 'bg-red-500',
      text: 'text-red-700',
    },
  };

  const colors = infoColors[infoType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-2xl bg-card-bg shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Top accent gradient */}
        <div className="h-1.5 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex-shrink-0 p-2 rounded-xl bg-gray-50 border border-gray-100">
                  {icon}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
                {description && (
                  <p className="text-[13px] text-gray-500 mt-0.5">{description}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-full p-1.5 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Detail rows */}
          {details && details.length > 0 && (
            <div className="mt-5 rounded-xl border border-gray-100 overflow-hidden">
              {details.map((detail, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between px-4 py-3",
                    index % 2 === 0 ? 'bg-gray-50/60' : 'bg-white',
                    index !== details.length - 1 && 'border-b border-gray-100'
                  )}
                >
                  <span className="text-[13px] text-gray-500 font-medium">{detail.label}</span>
                  <span className="text-[13px] font-bold text-gray-900">{detail.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Info message */}
          {infoMessage && (
            <div className={cn(
              "mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl border",
              colors.bg,
              colors.border
            )}>
              <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", colors.dot)} />
              <p className={cn("text-[12px] leading-relaxed font-medium", colors.text)}>
                {infoMessage}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-10 px-6 rounded-xl border border-gray-200 bg-white text-[13px] font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "h-10 px-6 rounded-xl text-[13px] font-bold text-white transition-all shadow-sm disabled:opacity-70 flex items-center gap-2",
              confirmVariant === 'danger'
                ? "bg-red-600 hover:bg-red-700 shadow-red-100"
                : "bg-primary-600 hover:bg-primary-700 shadow-primary-900/10"
            )}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
