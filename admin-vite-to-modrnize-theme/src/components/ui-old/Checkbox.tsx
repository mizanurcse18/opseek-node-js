import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, onCheckedChange, label, className, disabled, error, ...props }, ref) => {
    return (
      <div className={cn("flex items-center", className)}>
        <label className={cn(
          "relative flex items-center justify-center cursor-pointer group",
          disabled && "cursor-not-allowed opacity-50"
        )}>
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
            disabled={disabled}
            ref={ref}
            {...props}
          />
          <div className={cn(
            "w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center translate-y-[1px]",
            checked 
              ? "bg-primary-600 border-primary-600 shadow-sm" 
              : "bg-white border-gray-300 group-hover:border-primary-500",
            error && !checked && "border-red-500"
          )}>
            {checked && <Check className="h-3.5 w-3.5 text-white stroke-[3.5]" />}
          </div>
          {label && (
            <span className="ml-2.5 text-sm font-medium text-gray-700 select-none">
              {label}
            </span>
          )}
        </label>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
