import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
}

export function Modal({ isOpen, onClose, title, children, footer, headerAction, className, maxWidth = 'lg' }: ModalProps) {
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

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-[96vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-50 w-full rounded-xl bg-card-bg text-text-main shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col',
          'max-h-[92vh]',
          maxWidthClasses[maxWidth],
          className
        )}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border-theme shrink-0">
          {title && <h2 className="text-lg font-bold tracking-tight">{title}</h2>}
          <div className="flex items-center gap-3 ml-auto">
            {headerAction}
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-primary-500/10 transition-colors"
            >
              <X className="h-5 w-5 text-text-muted" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Sticky footer — always visible */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-border-theme bg-card-bg rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

