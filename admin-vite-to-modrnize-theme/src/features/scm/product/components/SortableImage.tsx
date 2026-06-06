import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Eye, Trash2, Star } from 'lucide-react';
import { ProductImage } from './ProductForm'; // type re‑use

/**
 * A draggable thumbnail used inside the product image gallery.
 * It forwards the DnD props to the wrapper element and retains all
 * existing UI behaviour (preview, delete, make‑primary).
 */
export default function SortableImage({
  img,
  onSetPrimary,
  onRemove,
  onPreview,
}: {
  img: ProductImage;
  onSetPrimary: (key: string) => void;
  onRemove: (key: string) => void;
  onPreview?: (fileKey: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: img.fileKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style as React.CSSProperties}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50 flex flex-col transition-all duration-300",
        img.isPrimary && "border-amber-400 shadow-sm ring-1 ring-amber-400/20 bg-amber-50/5",
        "cursor-grab"
      )}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] w-full overflow-hidden relative bg-white border-b border-slate-100">
        <img
          src={img.url}
          alt={img.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/200x150?text=Error';
          }}
        />

        {/* Hover controls */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSetPrimary(img.fileKey); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-white text-slate-500 hover:text-amber-500"
            title="Make Primary"
          >
            <Star className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(img.fileKey); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-white text-slate-700 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPreview?.(img.fileKey); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-white text-slate-700 hover:text-indigo-600"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Primary badge */}
        {img.isPrimary && (
          <span className="absolute top-2 left-2 bg-amber-500 text-white rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
            <Star className="w-2.5 h-2.5 fill-current" /> Primary
          </span>
        )}
      </div>

      {/* Title details */}
      <div className="p-2 min-w-0">
        <p className="text-[9px] font-black text-slate-700 uppercase tracking-tight leading-none truncate" title={img.name}>
          {img.name}
        </p>
        <p className="text-[7px] text-slate-400 font-mono truncate mt-1">
          {img.fileKey.substring(0, 12)}...
        </p>
      </div>
    </div>
  );
}
