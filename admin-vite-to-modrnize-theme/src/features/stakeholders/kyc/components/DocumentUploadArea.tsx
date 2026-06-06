import React, { useState } from 'react';
import { Upload, Plane, Briefcase, Car, FileText, Check, Eye, Trash2 } from 'lucide-react';

import { UploadBox } from './shared';
import { cn } from '@/lib/utils';
import { kycService } from '@/lib/auth/api/kyc.service';
import { storageService } from '@/lib/auth/api/storage.service';
import MediaViewer from './MediaViewer';

type DocType = 'passport' | 'trade' | 'license' | 'other';

export default function DocumentUploadArea({ 
  onTypeChange, 
  onUpload,
  onRemove,
  uploadedDocs = [],
  config
}: { 
  onTypeChange?: (type: DocType) => void, 
  onUpload?: (doc: any) => void,
  onRemove?: (type: string) => void,
  uploadedDocs?: any[],
  config?: any
}) {
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    currentIndex: 0,
    media: [] as Array<{ url: string; title: string }>
  });

  const isTypeVisible = (typeId: string) => {
    if (!config) return true;
    const field = config.fields.find((f: any) => f.id === typeId);
    return field ? field.isVisible : true;
  };

  const docTypes = [
    { id: 'passport' as DocType, label: 'Passport', icon: Plane },
    { id: 'trade' as DocType, label: 'Trade License', icon: Briefcase },
    { id: 'license' as DocType, label: "Driver's License", icon: Car },
    { id: 'other' as DocType, label: 'Other Docs', icon: FileText },
  ].filter(t => isTypeVisible(t.id));

  const [selectedType, setSelectedType] = useState<DocType>(docTypes[0]?.id || 'trade');

  const handleTypeChange = (type: DocType) => {
    setSelectedType(type);
    onTypeChange?.(type);
  };

  const [isUploading, setIsUploading] = useState(false);
  const [activeSide, setActiveSide] = useState<string | null>(null);

  const handleFileSelect = async (side: string, file: File) => {
    try {
      setIsUploading(true);
      setActiveSide(side);

      const previewUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result?.toString().split(',')[1];
          if (!base64Data) return;

          const docType = selectedType === 'trade' ? 'TRADE_LICENSE' : 
                         selectedType === 'passport' ? 'PASSPORT' : 
                         selectedType === 'license' ? `DRIVING_LICENSE_${side.toUpperCase()}` : 'OTHER_DOC';
          
          const existingDoc = uploadedDocs.find(d => d.document_type === docType);
          const oldFileKey = existingDoc?.file_key;

          const response = await kycService.uploadDocument({
            fileData: base64Data,
            fileName: file.name,
            documentType: docType,
            oldFileKey: oldFileKey
          });

          if (response.response_code === 'SUCCESS' || response.responseCode === 'SUCCESS' || response.data) {
            onUpload?.({
              document_type: docType,
              file_name: file.name,
              file_path: response.data?.file_path || response.data?.FilePath || response.data?.filePath,
              file_key: response.data?.file_key || response.data?.FileKey || response.data?.fileKey,
              file_type: file.type.includes('pdf') ? 'PDF' : 'Image',
              status: 'Uploaded',
              is_pdf: file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            });
          }
        } catch (err: any) {
          console.error('[KYC] Document upload failed:', err);
        } finally {
          setIsUploading(false);
          setActiveSide(null);
        }
      };
    } catch (error) {
      console.error('[KYC] File reading failed:', error);
      setIsUploading(false);
      setActiveSide(null);
    }
  };

  const openViewer = (idx: number, filteredDocs: any[]) => {
    const media = filteredDocs.map(d => ({
      url: (d.file_path || '').startsWith('blob:') ? d.file_path : storageService.getDownloadUrl((d.file_path || '').split('/').pop() || ''),
      title: d.document_type.replace(/_/g, ' '),
      type: (d.is_pdf || (d.file_path || '').toLowerCase().endsWith('.pdf')) ? 'application/pdf' : undefined
    }));
    setViewerState({
      isOpen: true,
      currentIndex: idx,
      media
    });
  };

  // Helper to check if a document type is fully uploaded
  const isTypeUploaded = (type: DocType) => {
    if (type === 'license') {
      return uploadedDocs.some(d => d.document_type === 'DRIVING_LICENSE_FRONT') && 
             uploadedDocs.some(d => d.document_type === 'DRIVING_LICENSE_BACK');
    }
    const mappedType = type === 'passport' ? 'PASSPORT' : 
                       type === 'trade' ? 'TRADE_LICENSE' : 'OTHER_DOC';
    return uploadedDocs.some(d => d.document_type === mappedType);
  };

  const getUploadLabel = () => {
    switch (selectedType) {
      case 'passport': return 'Passport Photo Page';
      case 'trade': return 'Trade License / Business Certificate';
      case 'license': return "Driver's License (Front)";
      default: return 'Supporting Document';
    }
  };

  const filteredDocs = uploadedDocs.filter(d => {
    const mappedType = selectedType === 'passport' ? 'PASSPORT' : 
                      selectedType === 'trade' ? 'TRADE_LICENSE' : 
                      selectedType === 'license' ? 'DRIVING_LICENSE' : 'OTHER_DOC';
    return d.document_type.startsWith(mappedType);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center">
          <Upload className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-sm font-black text-text-main uppercase tracking-tight">Business Documents</h2>
          <p className="text-[10px] text-text-muted font-medium">Select type and upload your documents</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {docTypes.map((type) => {
          const isActive = selectedType === type.id;
          const isUploaded = isTypeUploaded(type.id);
          
          return (
            <button
              key={type.id}
              onClick={() => handleTypeChange(type.id)}
              className={cn(
                "relative p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-3 group",
                isActive 
                  ? "bg-white border-primary-600 shadow-lg shadow-primary-600/5 scale-[1.02] z-10" 
                  : "bg-card-bg/30 border-border-theme hover:border-primary-600/30 hover:bg-white"
              )}
            >
              {isUploaded && (
                <div className={cn(
                  "absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in duration-300",
                  isActive ? "bg-primary-600 shadow-sm" : "bg-emerald-500"
                )}>
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                isActive ? "bg-primary-600/10 text-primary-600" : "bg-white/50 text-text-muted group-hover:text-text-main shadow-sm"
              )}>
                <type.icon className={cn("w-5 h-5", isActive && "animate-pulse")} />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest text-center",
                isActive ? "text-primary-600" : "text-text-muted group-hover:text-text-main"
              )}>
                {type.label}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-[1px] left-4 right-4 h-0.5 bg-primary-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <UploadBox 
          label={getUploadLabel()} 
          sub="PDF, PNG, JPG up to 10MB" 
          onFileSelect={(file) => handleFileSelect('Front', file)} 
          isLoading={isUploading && activeSide === 'Front'}
        />
        {selectedType === 'license' && (
          <UploadBox 
            label="Driver's License (Back)" 
            sub="Mandatory for ID cards" 
            onFileSelect={(file) => handleFileSelect('Back', file)} 
            isLoading={isUploading && activeSide === 'Back'}
          />
        )}
      </div>

      {filteredDocs.length > 0 && (
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Uploaded Documentation</h3>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="w-[50%] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Document</th>
                  <th className="w-[20%] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell text-center">Category</th>
                  <th className="w-[15%] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="w-[15%] px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDocs.map((doc, idx) => {
                  const isPdf = (doc.is_pdf || (doc.file_path || '').toLowerCase().endsWith('.pdf'));
                  const fileUrl = (doc.file_path || '').startsWith('blob:') ? doc.file_path : storageService.getDownloadUrl((doc.file_path || '').split('/').pop() || '');
                  
                  return (
                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {isPdf ? (
                              <FileText className="w-5 h-5 text-red-500 opacity-60" />
                            ) : (
                              <img 
                                src={fileUrl} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/100x75?text=Img';
                                }}
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-slate-900 uppercase leading-none truncate" title={doc.file_name || doc.document_type}>
                              {doc.file_name || doc.document_type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mt-1 truncate">
                              {doc.document_type.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-center">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                          {selectedType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest",
                            doc.status === 'Uploaded' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                          )}>
                            {doc.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1 md:gap-2">
                          <button 
                            onClick={() => openViewer(idx, filteredDocs)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-primary-600 hover:border-primary-100 hover:bg-primary-50 transition-all active:scale-90"
                            title="View Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onRemove?.(doc.document_type)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all active:scale-90"
                            title="Remove Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Reusable Modal Viewer */}
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
