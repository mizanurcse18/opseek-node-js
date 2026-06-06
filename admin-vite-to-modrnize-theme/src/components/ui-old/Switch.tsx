import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
}

export function Switch({ checked, onCheckedChange, label, className, disabled, ...props }: SwitchProps) {
  return (
    <label className={cn("inline-flex items-center cursor-pointer group", disabled && "cursor-not-allowed opacity-50", className)}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          disabled={disabled}
          {...props}
        />
        <div 
          className={cn(
            "w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ring-0 shadow-inner",
            checked ? "bg-primary-600" : "bg-border-theme"
          )}
        />
        <div 
          className={cn(
            "absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out shadow-sm transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </div>
      {label && (
        <span className="ml-3 text-sm font-medium text-text-main select-none">
          {label}
        </span>
      )}
    </label>
  );
}
