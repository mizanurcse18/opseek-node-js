import React from 'react';
import { Upload, FileText, CheckCircle2, Eye, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BdFlag = () => (
  <svg width="16" height="10" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <rect width="20" height="12" rx="1" fill="#006747" />
    <circle cx="9" cy="6" r="4" fill="#F42A41" />
  </svg>
);

import { Loader2 } from 'lucide-react';

export function UploadBox({ label, sub, onFileSelect, isLoading }: { label: string, sub?: string, onFileSelect?: (file: File) => void, isLoading?: boolean }) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };
  return (
    <div
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={0}
      className={cn(
        "border border-dashed border-border-theme rounded-lg p-6 flex flex-col items-center justify-center gap-3 bg-content-bg/10 hover:bg-content-bg/30 transition-all cursor-pointer group outline-none focus-within:border-primary-600 focus-within:ring-4 focus-within:ring-primary-600/5 focus-within:bg-white",
        isLoading && "opacity-60 cursor-not-allowed"
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf"
        disabled={isLoading}
      />
      <div className="w-8 h-8 rounded-lg bg-primary-600/5 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
      </div>
      <div className="text-center">
        <p className="text-[9px] font-black text-text-main uppercase tracking-widest">
          {isLoading ? 'Uploading...' : label}
        </p>
        {sub && <p className="text-[7px] text-text-muted font-bold uppercase mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function AnalysisMetric({ label, value, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-black uppercase tracking-widest text-text-main">{label}</span>
        <span className={cn("text-[8px] font-black uppercase tracking-widest", color === 'emerald' ? 'text-emerald-500' : 'text-amber-500')}>
          {value}%
        </span>
      </div>
      <div className="w-full h-1 bg-border-theme rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-1000", color === 'emerald' ? 'bg-emerald-500' : 'bg-primary-600')}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

import { storageService } from '@/lib/auth/api/storage.service';

export function DocTableRow({ name, type, status, path }: any) {
  const handleView = () => {
    if (!path) return;
    const url = path.startsWith('blob:') ? path : storageService.getDownloadUrl(path.split('/').pop()!);
    window.open(url, '_blank');
  };

  return (
    <tr className="hover:bg-content-bg/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="w-3 h-3 text-primary-600 opacity-60" />
          <span className="text-[10px] font-bold text-text-main truncate max-w-[100px]">{name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted">{type}</td>
      <td className="px-4 py-3">
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest inline-flex items-center gap-1",
          (status === 'Verified' || status === 'Uploaded') ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
        )}>
          {status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          <button 
            onClick={handleView}
            className="p-1 text-text-muted hover:text-primary-600"
          >
            <Eye className="h-3 w-3" />
          </button>
          <button className="p-1 text-text-muted hover:text-red-500">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

