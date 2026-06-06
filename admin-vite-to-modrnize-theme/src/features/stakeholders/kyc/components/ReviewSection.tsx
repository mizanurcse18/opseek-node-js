import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';

export default function ReviewSection() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-center py-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-black text-text-main uppercase tracking-tight">Review</h2>
            <p className="text-[10px] text-text-muted font-medium">Finalize submission</p>
          </div>
        </div>

        <div className="w-12 h-12 rounded-full bg-primary-600/10 text-primary-600 flex items-center justify-center mx-auto mb-4">
          <Info className="w-6 h-6" />
        </div>
        <div className="max-w-xs mx-auto space-y-2">
          <h3 className="text-sm font-black text-text-main uppercase tracking-tight">Ready to verify</h3>
          <p className="text-[10px] text-text-muted leading-relaxed font-medium">
            Review your information in the right panel and uploaded files below before submitting.
          </p>
        </div>
    </div>
  );
}
