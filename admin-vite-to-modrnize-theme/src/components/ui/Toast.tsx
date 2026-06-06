import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastStatus = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  status?: ToastStatus;
  duration?: number; // duration in ms
}

export function Toast({
  open,
  onOpenChange,
  title,
  description,
  status = 'success',
  duration = 5000,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsAnimatingOut(false);

      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else if (isVisible) {
      handleClose();
    }
  }, [open, duration]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimatingOut(false);
      onOpenChange(false);
    }, 300); // 300ms animation duration
  };

  if (!isVisible && !open) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          bg: 'bg-emerald-50',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          Icon: Check,
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          Icon: AlertCircle,
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          Icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-blue-50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          Icon: Info,
        };
    }
  };

  const config = getStatusConfig();
  const { Icon } = config;

  const content = (
    <div
      className={cn(
        "fixed top-20 right-4 z-[200] flex w-full max-w-[360px] items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-lg transition-all duration-300",
        isAnimatingOut 
          ? "animate-out fade-out slide-out-to-right flex-col" 
          : "animate-in fade-in slide-in-from-top-2 sm:slide-in-from-right-8"
      )}
    >
      <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", config.iconBg)}>
        <Icon className={cn("h-5 w-5", config.iconColor)} strokeWidth={3} />
      </div>

      <div className="flex-1 space-y-1">
        <h3 className="text-[13px] font-bold text-[#2a1758]">{title}</h3>
        {description && (
          <p className="text-[11px] font-medium leading-relaxed text-gray-500">
            {description}
          </p>
        )}
      </div>

      <button
        onClick={handleClose}
        className="flex shrink-0 items-center justify-center rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  return document.body ? createPortal(content, document.body) : null;
}

// Hook to easily manage toast state
export function useToast() {
  const [toastProps, setToastProps] = useState<Omit<ToastProps, 'onOpenChange'>>({
    open: false,
    title: '',
    description: '',
    status: 'success',
  });

  const toast = React.useCallback(({ title, description, status = 'success', duration = 5000 }: Omit<ToastProps, 'open' | 'onOpenChange'>) => {
    setToastProps({ open: true, title, description, status, duration });
  }, []);

  const ToastComponent = React.useCallback(() => (
    <Toast
      {...toastProps}
      onOpenChange={(open) => setToastProps((p) => ({ ...p, open }))}
    />
  ), [toastProps]);

  return { toast, ToastComponent };
}
