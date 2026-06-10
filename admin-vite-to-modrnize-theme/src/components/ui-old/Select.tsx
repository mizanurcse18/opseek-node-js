import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

let selectIdCounter = 0;

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
  const [flipUp, setFlipUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectId = useRef(`select-${++selectIdCounter}`).current;

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  
  const filteredOptions = options.filter(opt => 
    (opt.label || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const closeMenu = useCallback(() => {
    setLeaving(true);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setLeaving(false);
    }, 150);
  }, []);

  const openMenu = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setLeaving(false);
    
    // Measure space below/above to decide flip direction
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const estimatedHeight = Math.min(320, Math.max(200, options.length * 36 + (isSearchable ? 48 : 0) + 16));
      setFlipUp(spaceBelow < estimatedHeight && spaceAbove > spaceBelow);
    }
    
    setIsOpen(true);
  }, [options.length, isSearchable]);

  const handleSelect = useCallback((optValue: string | number | null) => {
    if (disabled) return;
    onChange(optValue);
    setSearchTerm('');
    closeMenu();
  }, [disabled, onChange, closeMenu]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(null);
  }, [disabled, onChange]);

  const toggleOpen = useCallback(() => {
    if (!disabled) {
      if (isOpen) closeMenu();
      else openMenu();
    }
  }, [disabled, isOpen, closeMenu, openMenu]);

  // Click outside handler
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    // Delay adding listener to avoid the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  // Reposition on scroll/resize within modal
  useEffect(() => {
    if (!isOpen) return;
    const reposition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 8;
        const spaceAbove = rect.top - 8;
        setFlipUp(spaceBelow < 200 && spaceAbove > spaceBelow);
      }
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchTerm, isOpen]);

  useEffect(() => {
    if (isOpen && isSearchable) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, isSearchable]);

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
      {/* Trigger */}
      <div 
        className={cn(
          "min-h-[42px] px-3 py-1.5 rounded-lg flex items-center justify-between transition-all duration-200 outline-none border",
          disabled ? "bg-card-bg/50 border-border-theme/50 cursor-not-allowed opacity-50" : "bg-card-bg border-border-theme cursor-pointer hover:border-primary-600/50",
          isOpen ? "border-primary-600 ring-4 ring-primary-600/5 shadow-sm" : "",
          (error || className?.includes('border-red-500')) && !isOpen && !disabled && "border-red-500 bg-red-50/10"
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
              className="h-3 w-3 cursor-pointer text-primary-600/45 hover:text-primary-600 transition-colors" 
              onClick={handleClear}
            />
          )}
          <div className="w-[1px] h-4 bg-border-theme" />
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </div>

      {/* Dropdown — rendered inline, positioned with CSS, no portal */}
      {(isOpen || leaving) && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            left: 0,
            width: '100%',
            [flipUp ? 'bottom' : 'top']: '100%',
            zIndex: 9999,
            marginTop: flipUp ? 0 : 4,
            marginBottom: flipUp ? 4 : 0,
          }}
          className={cn(
            "bg-card-bg border border-border-theme rounded-xl shadow-2xl overflow-hidden",
            leaving
              ? "animate-out fade-out zoom-out-95 duration-150"
              : "animate-in fade-in zoom-in-95 duration-150"
          )}
        >
          {isSearchable && (
            <div className="p-2 border-b border-border-theme flex items-center gap-2 bg-content-bg/30">
               <Search className="h-3.5 w-3.5 text-text-muted ml-1" />
               <input 
                 ref={inputRef}
                 type="text"
                 placeholder="Search..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="flex-1 bg-transparent border-none outline-none text-xs h-7 placeholder:text-text-muted/50 min-w-0 text-text-main"
                 onClick={(e) => e.stopPropagation()}
               />
            </div>
          )}
          
          <div className="overflow-y-auto p-1 custom-scrollbar" style={{ maxHeight: '292px' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => {
                const isSelected = String(opt.value) === String(value);
                const isActive = index === activeIndex;
                return (
                  <div
                    key={opt.value}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors mb-0.5 last:mb-0",
                      isSelected 
                        ? "bg-primary-600 text-white font-bold" 
                        : isActive 
                          ? "bg-primary-500/10 text-primary-600" 
                          : "text-text-main hover:bg-primary-500/5 hover:text-primary-600"
                    )}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
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
