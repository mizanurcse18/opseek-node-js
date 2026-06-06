import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Maximize2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import SecureImage from '@/components/ui-old/SecureImage';
import { apiClient } from '@/lib/axios';

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  media: Array<{ url: string; title: string; type?: string }>;
  currentIndex: number;
  onIndexChange?: (index: number) => void;
}

export default function MediaViewer({
  isOpen,
  onClose,
  media,
  currentIndex,
  onIndexChange
}: MediaViewerProps) {
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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, media]);

  if (!isOpen || media.length === 0) return null;

  const currentMedia = media[currentIndex];
  const isPdf = (currentMedia?.url || '').toLowerCase().endsWith('.pdf') || currentMedia?.type === 'application/pdf';

  const handleNext = () => {
    if (onIndexChange) {
      onIndexChange((currentIndex + 1) % media.length);
    }
  };

  const handlePrev = () => {
    if (onIndexChange) {
      onIndexChange((currentIndex - 1 + media.length) % media.length);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md cursor-zoom-out" 
        onClick={onClose} 
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between text-white py-2">
          <div className="flex flex-col">
            <h3 className="text-sm md:text-base font-black uppercase tracking-tight">{currentMedia.title}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              File {currentIndex + 1} of {media.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={currentMedia.url} 
              download 
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative flex-1 bg-slate-900/50 rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center">
          {/* Navigation Arrows */}
          {media.length > 1 && (
            <>
              <button 
                onClick={handlePrev}
                className="absolute left-4 z-20 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all active:scale-90"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={handleNext}
                className="absolute right-4 z-20 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all active:scale-90"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Media Content */}
          <div className="w-full h-full p-4 flex items-center justify-center">
            {isPdf ? (
              <iframe 
                src={`${currentMedia.url}#toolbar=0`} 
                className="w-full h-full rounded-xl"
                title={currentMedia.title}
              />
            ) : (
              <img 
                src={currentMedia.url} 
                alt={currentMedia.title}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-500"
              />
            )}
          </div>
        </div>

        {/* Thumbnail Strip (Optional) */}
        {media.length > 1 && (
          <div className="flex justify-center gap-2 overflow-x-auto pb-4 px-4 no-scrollbar">
            {media.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onIndexChange?.(idx)}
                className={cn(
                  "w-16 h-16 rounded-xl border-2 transition-all flex-shrink-0 overflow-hidden bg-slate-800 flex items-center justify-center",
                  currentIndex === idx ? "border-primary-500 scale-110" : "border-transparent opacity-50 hover:opacity-100"
                )}
              >
                {(item.url || '').toLowerCase().endsWith('.pdf') ? (
                  <FileText className="w-6 h-6 text-red-500" />
                ) : (
                  <img src={item.url} className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
