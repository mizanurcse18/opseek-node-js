import React, { useState, useCallback } from 'react';
import CategoryTable from '../components/CategoryTable';
import { CategoryModal } from '../components/CategoryModal';
import { CategoryTreeView } from '../components/CategoryTreeView';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { Button } from '@/components/ui/Button';
import { FolderTree, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryPageProps {
  isSuperUser?: boolean;
}

export default function CategoryPage({ isSuperUser = false }: CategoryPageProps) {
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey]   = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const pageTitle = useMenuTitle();

  const handleSave  = useCallback(() => setRefreshKey(prev => prev + 1), []);
  const handleAdd   = useCallback(() => { setSelectedCategory(null);  setIsModalOpen(true); }, []);
  const handleEdit  = useCallback((category: any) => { setSelectedCategory(category); setIsModalOpen(true); }, []);
  const handleClose = useCallback(() => { setIsModalOpen(false); setSelectedCategory(null); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'Category Management'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Manage your product categories — names, hierarchy, and active status.
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
        </div>
      </div>

      {viewMode === 'table' ? (
        <>
          <CategoryTable
            key={refreshKey}
            onAdd={handleAdd}
            onEdit={handleEdit}
            isSuperUser={isSuperUser}
          />

          <CategoryModal
            isOpen={isModalOpen}
            onClose={handleClose}
            initialData={selectedCategory}
            onSave={handleSave}
            isSuperUser={isSuperUser}
          />
        </>
      ) : (
        <CategoryTreeView isSuperUser={isSuperUser} />
      )}
    </div>
  );
}
