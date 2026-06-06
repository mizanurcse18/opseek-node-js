import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Option {
  value: string | number;
  label: string;
}

interface SelectProps {
  options: Option[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  className?: string;
  isSearchable?: boolean;
  isClearable?: boolean;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

export function Select({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select option...", 
  className,
  isSearchable = true,
  isClearable = true,
  error = false,
  disabled = false,
  required = false,
  name
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeMenu();
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
    if (isOpen && isSearchable) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, isSearchable]);

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  
  const filteredOptions = options.filter(opt => 
    (opt.label || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const closeMenu = () => {
    setLeaving(true);
    setSearchTerm('');
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setLeaving(false);
    }, 150);
  };

  const openMenu = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setLeaving(false);
    setIsOpen(true);
  };

  const handleSelect = (optValue: string | number | null) => {
    if (disabled) return;
    onChange(optValue);
    closeMenu();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(null);
  };

  const toggleOpen = () => {
    if (!disabled) {
      if (isOpen) closeMenu();
      else openMenu();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    switch (e.key) {
      // Prevents form submission
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelect(filteredOptions[activeIndex].value);
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
        closeMenu();
        break;
      case 'Tab':
        closeMenu();
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
          "min-h-[42px] px-3 py-1.5 rounded-lg flex items-center justify-between transition-all duration-200 outline-none border",
          disabled ? "bg-card-bg/50 cursor-not-allowed opacity-50 border-border-theme/50" : "bg-card-bg cursor-pointer border-border-theme hover:border-primary-600/50",
          isOpen ? "ring-4 ring-primary-600/5 border-primary-600" : "",
          (error || className?.includes('border-red-500')) && !isOpen && !disabled && "border-red-500"
        )}
        onClick={toggleOpen}
      >
        <div className="flex-1 truncate">
          {selectedOption ? (
            <span className="text-sm text-text-main font-medium">{selectedOption.label}</span>
          ) : (
            <span className="text-sm text-text-muted">{placeholder}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-text-muted">
          {isClearable && value !== null && value !== undefined && value !== '' && (
            <X 
              className="h-3.5 w-3.5 cursor-pointer hover:text-primary-600 transition-colors" 
              onClick={handleClear}
            />
          )}
          <div className="w-[1px] h-4 bg-border-theme" />
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </div>

      {(isOpen || leaving) && (
        <div className={cn(
          "absolute z-[100] w-full mt-2 bg-card-bg border border-border-theme rounded-xl shadow-2xl overflow-hidden",
          leaving
            ? "animate-out fade-out duration-150 pointer-events-none"
            : "animate-in fade-in duration-200"
        )}>
          {leaving && <div className="absolute inset-0 z-10" />}
          {isSearchable && (
            <div className="p-2 border-b border-border-theme flex items-center gap-2 bg-content-bg/30">
               <Search className="h-3.5 w-3.5 text-text-muted ml-1" />
               <input 
                 ref={inputRef}
                 type="text"
                 placeholder="Search..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="flex-1 bg-transparent border-none outline-none text-[13px] h-7 placeholder:text-text-muted/50 text-text-main"
                 onClick={(e) => e.stopPropagation()}
               />
            </div>
          )}
          
          <div className="max-h-[220px] overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => {
                const isSelected = String(opt.value) === String(value);
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
                    onClick={() => handleSelect(opt.value)}
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
      
      {/* Hidden input for form validation */}
      <input
        type="hidden"
        name={name}
        value={value || ''}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

