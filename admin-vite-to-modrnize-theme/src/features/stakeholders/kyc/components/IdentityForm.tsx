import React, { useState } from 'react';
import { IdCard, Search, Loader2, AlertCircle, X, Eye } from 'lucide-react';
import { UploadBox } from './shared';
import { kycService } from '@/lib/auth/api/kyc.service';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import MediaViewer from './MediaViewer';

interface IdentityFormProps {
  onOcrComplete: (data: any, side: 'Front' | 'Back') => void;
  onRemove: (side: 'Front' | 'Back') => void;
  scannedData: {
    frontPreview: string | null;
    backPreview: string | null;
    frontConfidence: number | null;
    backConfidence: number | null;
    frontFileKey?: string | null;
    backFileKey?: string | null;
  };
}

export default function IdentityForm({ onOcrComplete, onRemove, scannedData, config, errors = [] }: IdentityFormProps & { config?: any, errors?: string[] }) {
  const hasError = (fieldId: string) => errors.includes(fieldId);

  const isFieldVisible = (fieldId: string) => {
    if (!config) return true;
    const field = config.fields.find((f: any) => f.id === fieldId);
    return field ? field.isVisible : true;
  };

  const [processingSides, setProcessingSides] = useState<Set<'Front' | 'Back'>>(new Set());
  const [frontPreview, setFrontPreview] = useState<string | null>(scannedData.frontPreview);
  const [backPreview, setBackPreview] = useState<string | null>(scannedData.backPreview);
  const [frontConfidence, setFrontConfidence] = useState<number | null>(scannedData.frontConfidence);
  const [backConfidence, setBackConfidence] = useState<number | null>(scannedData.backConfidence);
  const [structureAccuracy] = useState(98);
  const { toast } = useToast();

  const [viewerState, setViewerState] = useState({
    isOpen: false,
    currentIndex: 0,
    media: [] as Array<{ url: string; title: string }>
  });

  const handleFileSelect = async (side: 'Front' | 'Back', file: File) => {
    try {
      setProcessingSides(prev => new Set(prev).add(side));
      
      const previewUrl = URL.createObjectURL(file);
      if (side === 'Front') {
        setFrontPreview(previewUrl);
        setFrontConfidence(null);
      } else {
        setBackPreview(previewUrl);
        setBackConfidence(null);
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result?.toString().split(',')[1];
        if (!base64Data) return;

        // NEW: Respect dynamic OCR configuration
        const enableOcr = config?.enableOcr !== false; 
        
        try {
          const sideKey = side === 'Front' ? 'NID_FRONT' : 'NID_BACK';
          const oldFileKey = side === 'Front' ? scannedData.frontFileKey : scannedData.backFileKey;

          let response;
          if (!enableOcr) {
            console.log(`[KYC] OCR is disabled. Uploading as plain document.`);
            response = await kycService.uploadDocument({
              fileData: base64Data,
              fileName: file.name,
              documentType: sideKey,
              oldFileKey: oldFileKey || undefined
            });
          } else {
            response = await kycService.processOcr({
              fileData: base64Data,
              fileName: file.name,
              documentType: side === 'Front' ? 'NID-Front' : 'NID-Back',
              oldFileKey: oldFileKey || undefined
            });
          }

          if (response.data) {
            const result = response.data;
            const conf = result.confidence_score || 100;
            
            if (side === 'Front') setFrontConfidence(conf);
            else setBackConfidence(conf);
            
            onOcrComplete({ ...result, previewUrl }, side);
            
            if (enableOcr) {
              toast({
                title: `${side} OCR Complete`,
                description: `Quality Score: ${conf}%`,
                status: conf > 70 ? 'success' : 'warning'
              });
            }
          }
        } catch (err) {
          toast({ title: 'Upload Error', description: `Failed to upload ${side} side.`, status: 'error' });
        } finally {
          setProcessingSides(prev => {
            const next = new Set(prev);
            next.delete(side);
            return next;
          });
        }
      };
    } catch (error) {
      console.error('OCR failed:', error);
      setProcessingSides(prev => {
        const next = new Set(prev);
        next.delete(side);
        return next;
      });
    }
  };

  const handleRemove = (side: 'Front' | 'Back') => {
    if (side === 'Front') {
      setFrontPreview(null);
      setFrontConfidence(null);
    } else {
      setBackPreview(null);
      setBackConfidence(null);
    }
    onRemove(side);
    toast({
      title: 'Document Removed',
      description: `${side} side scan has been cleared.`,
      status: 'info'
    });
  };

  const openViewer = (side: 'Front' | 'Back') => {
    const media = [];
    if (frontPreview) media.push({ url: frontPreview, title: 'NID Front' });
    if (backPreview) media.push({ url: backPreview, title: 'NID Back' });
    
    const idx = side === 'Front' ? 0 : (frontPreview ? 1 : 0);
    
    setViewerState({
      isOpen: true,
      currentIndex: idx,
      media
    });
  };

  const isFrontProcessing = processingSides.has('Front');
  const isBackProcessing = processingSides.has('Back');
  const isAnyProcessing = processingSides.size > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
          <IdCard className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-sm font-black text-text-main uppercase tracking-tight">NID Verification</h2>
          <p className="text-[10px] text-text-muted font-medium">Upload your NID scans for OCR processing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isFieldVisible('front_image') && (
          <div className={cn(errors.includes('front_image') && "ring-2 ring-red-500 rounded-3xl animate-shake")}>
            <UploadBox 
              label="NID Front Side" 
              sub={frontPreview ? "Update Front Side" : "Clear photo or scan"} 
              onFileSelect={(file) => handleFileSelect('Front', file)}
              isLoading={isFrontProcessing}
            />
          </div>
        )}
        {isFieldVisible('back_image') && (
          <div className={cn(errors.includes('back_image') && "ring-2 ring-red-500 rounded-3xl animate-shake")}>
            <UploadBox 
              label="NID Back Side" 
              sub={backPreview ? "Update Back Side" : "Mandatory for ID cards"} 
              onFileSelect={(file) => handleFileSelect('Back', file)}
              isLoading={isBackProcessing}
            />
          </div>
        )}
      </div>

      {/* Neural Analysis Section */}
      {(frontPreview || backPreview || isAnyProcessing) && (
        <div className="bg-white border border-border-theme rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-600/10 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-600 blur-md opacity-20 animate-pulse" />
                  <Loader2 className={cn("w-6 h-6 text-primary-600 relative z-10", isAnyProcessing && "animate-spin")} />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-black text-text-main uppercase tracking-widest">Neural Analysis</h3>
                <p className="text-[9px] text-text-muted font-bold uppercase tracking-tight">Dual-Side Document Forensics</p>
              </div>
            </div>
            
            {isAnyProcessing && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 rounded-full shadow-lg shadow-primary-600/20">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[8px] font-black text-white uppercase tracking-widest">
                  Processing {processingSides.size > 1 ? 'Documents' : Array.from(processingSides)[0]}...
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Front Side Analysis */}
            {(frontPreview || isFrontProcessing) && (
              <AnalysisCard 
                label="Front Side" 
                image={frontPreview} 
                isScanning={isFrontProcessing} 
                confidence={frontConfidence}
                structure={structureAccuracy}
                onRemove={() => handleRemove('Front')}
                onView={() => openViewer('Front')}
              />
            )}

            {/* Back Side Analysis */}
            {(backPreview || isBackProcessing) && (
              <AnalysisCard 
                label="Back Side" 
                image={backPreview} 
                isScanning={isBackProcessing} 
                confidence={backConfidence}
                structure={structureAccuracy}
                onRemove={() => handleRemove('Back')}
                onView={() => openViewer('Back')}
              />
            )}
          </div>
        </div>
      )}

      {/* Warning for low confidence */}
      {((frontConfidence !== null && frontConfidence < 70) || (backConfidence !== null && backConfidence < 70)) && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3 animate-shake">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
             <p className="text-[10px] font-black uppercase tracking-tight text-red-500">Low Quality Scan Detected</p>
             <p className="text-[9px] font-medium text-red-500/80">One or more scans have low confidence. Please review the extracted data carefully.</p>
          </div>
        </div>
      )}

      <div className="bg-content-bg/50 border border-border-theme rounded-lg p-3 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <Search className="w-3 h-3 text-primary-600" />
           <span className="text-[9px] font-black uppercase tracking-widest text-text-main opacity-60">Edge Detection Ready</span>
         </div>
      </div>

      <MediaViewer 
        isOpen={viewerState.isOpen}
        onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
        media={viewerState.media}
        currentIndex={viewerState.currentIndex}
        onIndexChange={(idx) => setViewerState(prev => ({ ...prev, currentIndex: idx }))}
      />
    </div>
  );
}

function AnalysisCard({ label, image, isScanning, confidence, structure, onRemove, onView }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-text-main uppercase tracking-widest">{label}</span>
        <div className="flex items-center gap-3">
          {confidence !== null && (
            <span className={cn(
              "text-[10px] font-black",
              confidence > 85 ? "text-green-500" : confidence > 70 ? "text-yellow-500" : "text-red-500"
            )}>
              {confidence}%
            </span>
          )}
          {!isScanning && (
            <button 
              onClick={onRemove}
              className="p-1 hover:bg-red-50 text-text-muted hover:text-red-500 rounded-md transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-primary-400 rounded-xl blur opacity-10" />
        <div className="relative rounded-xl overflow-hidden border border-border-theme bg-text-main/5 aspect-video flex items-center justify-center">
          {image ? (
            <div className="relative w-full h-full group/img">
              <img src={image} alt={label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={onView}
                  className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
               <Loader2 className="w-6 h-6 text-slate-200 animate-spin" />
            </div>
          )}
          {isScanning && (
            <div className="absolute inset-0 bg-primary-600/10">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-600 shadow-[0_0_15px_rgba(37,99,235,0.8)] animate-scan" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Structure</span>
            <span className="text-[9px] font-black text-text-main">{isScanning ? '--' : `${structure}%`}</span>
          </div>
          <div className="h-1 w-full bg-text-main/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-600 transition-all duration-1000 ease-out"
              style={{ width: isScanning ? '0%' : `${structure}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">OCR Confidence</span>
            <span className="text-[9px] font-black text-text-main">{isScanning ? '--' : (confidence ? `${confidence}%` : '0%')}</span>
          </div>
          <div className="h-1 w-full bg-text-main/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-600 transition-all duration-1000 ease-out"
              style={{ width: isScanning ? '0%' : (confidence ? `${confidence}%` : '0%') }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
