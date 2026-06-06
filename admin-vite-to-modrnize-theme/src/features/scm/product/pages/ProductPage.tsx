import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, Download, FolderTree, Table2, Loader2 } from 'lucide-react';
import ProductTable from '../components/ProductTable';
import { ProductModal } from '../components/ProductModal';
import { ProductTreeView } from '../components/ProductTreeView';
import UploadProgressModal from '../components/UploadProgressModal';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { productService } from '@/lib/scm/api/product.service';
import { companyService } from '@/lib/auth/api/company.service';
import { Select } from '@/components/ui-old/Select';
import { cn } from '@/lib/utils';

interface ProductPageProps {
  isSuperUser?: boolean;
}

export default function ProductPage({ isSuperUser = false }: ProductPageProps) {
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey]   = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const uploadFileRef = useRef<File | null>(null);

  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    if (isSuperUser) {
      companyService.getAllCompanies().then(res => {
        setCompanies(Array.isArray(res) ? res : []);
      });
    }
  }, [isSuperUser]);

  const handleSave  = useCallback(() => setRefreshKey(prev => prev + 1), []);
  const handleAdd   = useCallback(() => { setSelectedProduct(null);  setIsModalOpen(true); }, []);
  const handleEdit  = useCallback((product: any) => { setSelectedProduct(product); setIsModalOpen(true); }, []);
  const handleClose = useCallback(() => { setIsModalOpen(false); setSelectedProduct(null); }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFileRef.current = file;
    setUploadFileName(file.name);
    setIsUploadModalOpen(true);
  }, []);

  const handleUploadSubmit = useCallback(async () => {
    const file = uploadFileRef.current;
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await productService.csvUpload(file, selectedCompanyId || undefined);
      if (res?.response_code === 'SUCCESS' || res?.status_code === 200) {
        toast({ title: 'Success', description: res?.message || 'CSV imported successfully.', status: 'success' });
        setRefreshKey(prev => prev + 1);
      } else {
        toast(handleApiError(res));
      }
    } finally {
      setIsUploading(false);
    }
  }, [toast, selectedCompanyId]);

  const handleUploadClose = useCallback(() => {
    setIsUploadModalOpen(false);
    uploadFileRef.current = null;
    const input = document.querySelector<HTMLInputElement>('input[accept=".csv"]');
    if (input) input.value = '';
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'Product Management'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Manage your product catalog — pricing, categorisation, and finance ledger mapping.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('table')}
            className={cn(
              'h-8 px-3 text-[10px] font-black uppercase tracking-widest gap-1.5 rounded-lg transition-all',
              viewMode === 'table'
                ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 border-primary-600'
                : 'text-text-muted hover:text-primary-600 border-border-theme'
            )}
          >
            <Table2 className="h-3.5 w-3.5" />
            Table View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('tree')}
            className={cn(
              'h-8 px-3 text-[10px] font-black uppercase tracking-widest gap-1.5 rounded-lg transition-all',
              viewMode === 'tree'
                ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 border-primary-600'
                : 'text-text-muted hover:text-primary-600 border-border-theme'
            )}
          >
            <FolderTree className="h-3.5 w-3.5" />
            Tree View
          </Button>
          {viewMode === 'table' && (
            <>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const blob = await productService.exportCsv();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `products_export_${new Date().toISOString().slice(0,10)}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch {
                    toast({ title: 'Error', description: 'Failed to export CSV.', status: 'error' });
                  }
                }}
                className="h-7 flex items-center gap-2 px-3"
              >
                <Download className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">CSV Download</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => {
                  if (!isUploading) {
                    const input = document.querySelector<HTMLInputElement>('input[accept=".csv"]');
                    input?.click();
                  }
                }}
                className="h-7 flex items-center gap-2 px-3"
              >
                {isUploading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {isUploading ? 'Uploading...' : 'Import CSV'}
                </span>
              </Button>
              {isSuperUser && companies.length > 0 && (
                <Select
                  options={[{ value: '', label: 'All Companies' }, ...companies.map((c: any) => ({ value: c.value ?? c.id ?? c.company_id, label: c.label ?? c.name ?? c.company_name }))]}
                  value={selectedCompanyId}
                  onChange={(val) => setSelectedCompanyId(val?.toString() ?? '')}
                  placeholder="All Companies"
                  isSearchable={false}
                  isClearable={false}
                  className="w-40"
                />
              )}
            </>
          )}
        </div>
      </div>

      {viewMode === 'table' ? (
        <>
          <ProductTable
            key={refreshKey}
            onAdd={handleAdd}
            onEdit={handleEdit}
            isSuperUser={isSuperUser}
          />

          <ProductModal
            isOpen={isModalOpen}
            onClose={handleClose}
            initialData={selectedProduct}
            onSave={handleSave}
            isSuperUser={isSuperUser}
          />
        </>
      ) : (
        <ProductTreeView isSuperUser={isSuperUser} onRefreshGrid={() => setRefreshKey(prev => prev + 1)} />
      )}

      <UploadProgressModal
        isOpen={isUploadModalOpen}
        onClose={handleUploadClose}
        onSubmit={handleUploadSubmit}
        fileName={uploadFileName}
      />

      <ToastComponent />
    </div>
  );
}
