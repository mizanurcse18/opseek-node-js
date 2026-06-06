import React from 'react';
import { X, Check } from 'lucide-react';
import { THEME_SCHEMES, themeService } from '@/lib/theme.service';
import { cn } from '@/lib/utils';

interface ThemeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: string;
  onThemeChange: (id: string) => void;
}

export default function ThemeDrawer({ isOpen, onClose, currentThemeId, onThemeChange }: ThemeDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-full sm:w-[400px] bg-card-bg shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out flex flex-col border-l border-border-theme",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-border-theme flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-main">Theme Color Schemes</h2>
            <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
              * Selected color scheme will be applied to all theme layout elements (navbar, toolbar, etc.). 
              You can also select a different color scheme for each layout element at theme settings.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-content-bg text-text-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {THEME_SCHEMES.map((scheme) => (
              <div key={scheme.id} className="space-y-2">
                <button
                  onClick={() => {
                    themeService.applyTheme(scheme.id);
                    onThemeChange(scheme.id);
                  }}
                  className={cn(
                    "w-full aspect-[4/3] rounded-xl border-2 transition-all duration-200 overflow-hidden relative group",
                    currentThemeId === scheme.id 
                      ? "border-primary-600 shadow-md ring-2 ring-primary-100" 
                      : "border-gray-200 hover:border-primary-200 hover:shadow-sm"
                  )}
                >
                  {/* Visual Preview */}
                  <div className="h-full w-full flex flex-col">
                    {/* Header Preview - Uses actual header color or primary fallback */}
                    <div 
                      className="h-1/4 w-full flex items-center px-2 border-b"
                      style={{ 
                        backgroundColor: scheme.colors.headerBg,
                        borderColor: scheme.colors.borderColor
                      }}
                    >
                      <span 
                        className="text-[6px] font-bold uppercase"
                        style={{ color: scheme.colors.headerBg.toLowerCase() === '#ffffff' ? scheme.colors.primary600 : '#ffffff' }}
                      >
                        Header
                      </span>
                    </div>
                    {/* Body/Paper */}
                    <div 
                      className="flex-1 p-2 flex flex-col gap-1.5 relative"
                      style={{ backgroundColor: scheme.colors.contentBg }}
                    >
                      <div 
                        className="rounded-sm h-12 w-full border p-1"
                        style={{ 
                          backgroundColor: scheme.colors.cardBg,
                          borderColor: scheme.colors.borderColor
                        }}
                      >
                        <span 
                          className="text-[8px]"
                          style={{ color: scheme.colors.textMuted }}
                        >
                          Paper
                        </span>
                      </div>
                      <div className="mt-auto">
                        <span 
                          className="text-[6px] uppercase font-bold"
                          style={{ color: scheme.colors.textMuted }}
                        >
                          Background
                        </span>
                      </div>
                      
                      {/* Accent Dot */}
                      <div 
                        className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-1/2 h-4 w-4 rounded-full flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: scheme.id.includes('Dark') ? '#38bdf8' : '#f59e0b' }}
                      >
                        <span className="text-[6px] text-white font-black">S</span>
                      </div>
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {currentThemeId === scheme.id && (
                    <div className="absolute top-2 right-2 h-5 w-5 bg-primary-600 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
                <div className="text-center">
                  <span className={cn(
                    "text-[11px] font-bold",
                    currentThemeId === scheme.id ? "text-primary-600" : "text-text-muted"
                  )}>
                    {scheme.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-theme bg-content-bg/50">
          <button 
            onClick={onClose}
            className="w-full h-11 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
          >
            Dismiss
          </button>
        </div>
      </div>
    </>
  );
}
