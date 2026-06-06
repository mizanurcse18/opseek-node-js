import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Option {
  value: string | number;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({ options, value, onChange, placeholder = "Select options...", className, disabled = false }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset activeIndex when searching or opening
  useEffect(() => {
    setActiveIndex(-1);
  }, [searchTerm, isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const selectedOptions = options.filter(opt => value.some(v => String(v) === String(opt.value)));
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optValue: string | number) => {
    if (disabled) return;
    if (value.some(v => String(v) === String(optValue))) {
      onChange(value.filter(v => String(v) !== String(optValue)));
    } else {
      onChange([...value, optValue]);
    }
  };

  const removeOption = (e: React.MouseEvent, optValue: string | number) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(value.filter(v => String(v) !== String(optValue)));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          toggleOption(filteredOptions[activeIndex].value);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div 
      className={cn("relative outline-none", className)} 
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
    >
      <div 
        className={cn(
          "min-h-[42px] px-3 py-1.5 rounded-lg flex flex-wrap gap-1.5 items-center transition-all duration-200 outline-none border",
          disabled ? "bg-card-bg/50 cursor-not-allowed opacity-50 border-border-theme/50" : "bg-card-bg cursor-pointer border-border-theme hover:border-primary-600/50",
          isOpen ? "ring-4 ring-primary-600/5 border-primary-600" : "",
          (className?.includes('border-red-500')) && !isOpen && !disabled && "border-red-500"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map(opt => (
            <span 
              key={opt.value} 
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-600/10 text-primary-600 text-[11px] font-bold rounded-md border border-primary-600/20 group transition-colors hover:bg-primary-600/20"
            >
              {opt.label}
              <X 
                className="h-3 w-3 cursor-pointer text-primary-600/40 hover:text-primary-600 transition-colors" 
                onClick={(e) => removeOption(e, opt.value)}
              />
            </span>
          ))
        ) : (
          <span className="text-sm text-text-muted">{placeholder}</span>
        )}
        
        <div className="ml-auto flex items-center gap-2 text-text-muted">
           <div className="w-[1px] h-4 bg-border-theme" />
           <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-card-bg border border-border-theme rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-border-theme flex items-center gap-2 bg-content-bg/30">
             <Search className="h-3.5 w-3.5 text-text-muted ml-1" />
             <input 
               ref={inputRef}
               type="text"
               placeholder="Search items..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="flex-1 bg-transparent border-none outline-none text-[13px] h-7 placeholder:text-text-muted/50 text-text-main"
               onClick={(e) => e.stopPropagation()}
             />
          </div>
          
          <div className="max-h-[220px] overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => {
                const isSelected = value.some(v => String(v) === String(opt.value));
                const isActive = index === activeIndex;
                return (
                  <div
                    key={opt.value}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] cursor-pointer transition-colors mb-0.5 last:mb-0",
                      isSelected 
                        ? "bg-primary-600 text-white font-bold" 
                        : isActive
                          ? "bg-primary-500/10 text-primary-600"
                          : "text-text-main hover:bg-primary-500/5 hover:text-primary-600"
                    )}
                    onClick={() => toggleOption(opt.value)}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-text-muted italic">No items found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

