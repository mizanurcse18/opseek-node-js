import React from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  ChevronRight, 
  ChevronDown, 
  GripVertical, 
  Eye,
  EyeOff,
  Trash2,
  Plus
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MenuItem {
  menu_id: number;
  parent_id: number;
  application_id: number;
  id: string;
  title: string;
  translate: string;
  type: 'item' | 'collapse' | 'group';
  icon: string;
  url: string;
  target: '_blank' | '_self' | '_parent' | '_top';
  is_visible: boolean;
  sequence_no: number;
  children?: MenuItem[];
  row_editor_status?: string;
  badge?: string;
  exact?: boolean;
  auth?: string;
  parameters?: string;
  menu_type?: string; 
  company_id?: string | number;
  is_used?: boolean;
  apiPathMaps?: {
    mapid: number;
    menu_id: number;
    module: string;
    controller: string;
    api_path: string;
    action_type: string;
    button_id?: string;
    button_title?: string;
    row_version: string;
    row_editor_status?: string;
  }[];
}

// --- Tree utility functions ---

function findInTree(
  items: MenuItem[], 
  id: string, 
  parent: MenuItem | null = null
): { item: MenuItem; parent: MenuItem | null; index: number } | null {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === id) {
      return { item: items[i], parent, index: i };
    }
    if (items[i].children) {
      const result = findInTree(items[i].children!, id, items[i]);
      if (result) return result;
    }
  }
  return null;
}

function isDescendant(item: MenuItem, targetId: string): boolean {
  if (!item.children) return false;
  for (const child of item.children) {
    if (child.id === targetId) return true;
    if (isDescendant(child, targetId)) return true;
  }
  return false;
}

function removeFromTree(items: MenuItem[], id: string): MenuItem[] {
  return items
    .filter(item => item.id !== id)
    .map(item => ({
      ...item,
      children: item.children ? removeFromTree(item.children, id) : []
    }));
}

function computeReorderPayload(
  items: MenuItem[], 
  parentMenuId: number = 0
): { menu_id: number; parent_id: number; sequence_no: number }[] {
  const result: { menu_id: number; parent_id: number; sequence_no: number }[] = [];
  
  items.forEach((item, index) => {
    if (item.menu_id > 0) {
      result.push({
        menu_id: item.menu_id,
        parent_id: parentMenuId,
        sequence_no: index + 1
      });
    }
    
    if (item.children && item.children.length > 0) {
      result.push(...computeReorderPayload(item.children, item.menu_id));
    }
  });
  
  return result;
}

// --- Components ---

interface SortableTreeItemProps {
  item: MenuItem;
  depth: number;
  onSelect: (item: MenuItem) => void;
  onAddChild: (parentId: string) => void;
  selectedId?: string;
  onToggleExpand: (id: string) => void;
  isExpanded: boolean;
  isDropTarget?: boolean;
  onDelete: (item: MenuItem) => void;
}

function SortableTreeItem({ 
  item, 
  depth, 
  onSelect, 
  onAddChild,
  selectedId, 
  onToggleExpand, 
  isExpanded,
  isDropTarget,
  onDelete
}: SortableTreeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    marginLeft: `${depth * 20}px`,
  };

  const hasChildren = item.children && item.children.length > 0;
  const isSelected = selectedId === item.id;
  const isContainer = item.type === 'collapse' || item.type === 'group';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex flex-col mb-1",
        isDragging && "opacity-50 z-20"
      )}
    >
      <div 
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 cursor-pointer",
          isSelected 
            ? "bg-primary-600/10 border-primary-600/20 shadow-sm" 
            : "bg-card-bg border-border-theme hover:border-primary-600/30 hover:shadow-sm",
          isDropTarget && isContainer && "ring-2 ring-primary-600 border-primary-600 bg-primary-600/10"
        )}
        onClick={() => onSelect(item)}
      >
        <button 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-text-muted/50 hover:text-text-muted p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div 
          className="flex items-center justify-center p-1 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(item.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-4 w-4 text-text-muted" /> : <ChevronRight className="h-4 w-4 text-text-muted/50" />
          ) : (
            <div className="w-4" />
          )}
        </div>

        <div className="flex-1 flex items-center gap-2 min-w-0">
           <div className={cn(
             "p-1.5 rounded-md",
             isSelected ? "bg-primary-600 text-white" : "bg-content-bg text-text-muted"
           )}>
              {(() => {
                const IconComp = (Icons as any)[item.icon] || Icons.Circle;
                return <IconComp className="h-3.5 w-3.5" />;
              })()}
           </div>
           <div className="flex flex-col min-w-0">
             <span className={cn(
               "text-[12px] font-bold truncate",
               isSelected ? "text-primary-600" : "text-text-main"
             )}>
                {item.title}
             </span>
           </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
           <button 
             className="text-text-muted/50 hover:text-primary-600 p-1"
             title="Add Sub-menu"
             onClick={(e) => {
               e.stopPropagation();
               onAddChild(item.id);
             }}
           >
             <Plus className="h-3.5 w-3.5" />
           </button>
           {item.is_visible ? (
             <Eye className="h-3.5 w-3.5 text-emerald-500" />
           ) : (
             <EyeOff className="h-3.5 w-3.5 text-gray-300" />
           )}
           {item.is_used ? (
             <button 
               className="text-text-muted/20 cursor-not-allowed p-1" 
               title="This menu is used in Security Rules and cannot be deleted"
               disabled
             >
               <Icons.Lock className="h-3 w-3" />
             </button>
           ) : (
             <button 
               className="text-text-muted/50 hover:text-red-500 p-1" 
               onClick={(e) => {
                 e.stopPropagation();
                 onDelete(item);
               }}
             >
               <Trash2 className="h-3.5 w-3.5" />
             </button>
           )}
        </div>
      </div>
    </div>
  );
}

interface MenuTreeProps {
  items: MenuItem[];
  onItemsChange: (items: MenuItem[]) => void;
  onSelect: (item: MenuItem) => void;
  onAddChild: (parentId: string) => void;
  onReorder: (reorderData: { menu_id: number; parent_id: number; sequence_no: number }[]) => void;
  onDelete: (item: MenuItem) => void;
  selectedId?: string;
  expandedIds: Set<number>;
  onToggleExpand: (id: string) => void;
  onEnsureExpanded: (menuId: number) => void;
}

export default function MenuTree({ 
  items, 
  onItemsChange, 
  onSelect, 
  onAddChild, 
  onReorder, 
  onDelete, 
  selectedId,
  expandedIds,
  onToggleExpand,
  onEnsureExpanded
}: MenuTreeProps) {
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleExpand = (id: string) => {
    onToggleExpand(id);
  };

  // Flatten the tree for SortableContext
  const flattenItems = (items: MenuItem[], depth = 0): { item: MenuItem; depth: number }[] => {
    let result: { item: MenuItem; depth: number }[] = [];
    for (const item of items) {
      result.push({ item, depth });
      if (expandedIds.has(item.menu_id) && item.children) {
        result = [...result, ...flattenItems(item.children, depth + 1)];
      }
    }
    return result;
  };

  const flattened = flattenItems(items);
  const itemIds = flattened.map(({ item }) => item.id);

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setDropTargetId(null);
      return;
    }
    
    const overData = findInTree(items, over.id as string);
    if (overData && (overData.item.type === 'collapse' || overData.item.type === 'group')) {
      setDropTargetId(over.id as string);
    } else {
      setDropTargetId(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setDropTargetId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = findInTree(items, active.id as string);
    const overData = findInTree(items, over.id as string);
    if (!activeData || !overData) return;

    // Prevent dropping a parent into its own descendant
    if (isDescendant(activeData.item, over.id as string)) return;

    const overItem = overData.item;
    const isOverContainer = overItem.type === 'collapse' || overItem.type === 'group';
    const sameParent = activeData.parent?.id === overData.parent?.id;

    let newTree: MenuItem[];

    if (isOverContainer && activeData.parent?.id !== overItem.id) {
      // REPARENT: Drop into collapse/group as last child
      const movedItem = { ...activeData.item, parent_id: overItem.menu_id };
      newTree = removeFromTree(items, active.id as string);

      const addChildToContainer = (treeItems: MenuItem[]): MenuItem[] => {
        return treeItems.map(item => {
          if (item.id === overItem.id) {
            return { ...item, children: [...(item.children || []), movedItem] };
          }
          if (item.children) {
            return { ...item, children: addChildToContainer(item.children) };
          }
          return item;
        });
      };
      newTree = addChildToContainer(newTree);

      // Ensure the target container is expanded
      onEnsureExpanded(overItem.menu_id);

    } else if (sameParent) {
      // REORDER within same parent
      if (activeData.parent === null) {
        // Root level reorder
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        newTree = arrayMove([...items], oldIndex, newIndex);
      } else {
        // Child level reorder within same parent
        const parentId = activeData.parent.id;
        const reorderChildren = (treeItems: MenuItem[]): MenuItem[] => {
          return treeItems.map(item => {
            if (item.id === parentId && item.children) {
              const oldIdx = item.children.findIndex(c => c.id === active.id);
              const newIdx = item.children.findIndex(c => c.id === over.id);
              if (oldIdx !== -1 && newIdx !== -1) {
                return { ...item, children: arrayMove([...item.children], oldIdx, newIdx) };
              }
            }
            if (item.children) {
              return { ...item, children: reorderChildren(item.children) };
            }
            return item;
          });
        };
        newTree = reorderChildren(items);
      }
    } else {
      // MOVE to different parent (non-container target) — place as sibling of over item
      const newParentMenuId = overData.parent ? overData.parent.menu_id : 0;
      const movedItem = { ...activeData.item, parent_id: newParentMenuId };
      newTree = removeFromTree(items, active.id as string);

      const overParentId = overData.parent?.id || null;

      if (overParentId === null) {
        // Insert at root level next to over item
        const overIndex = newTree.findIndex(i => i.id === over.id);
        if (overIndex !== -1) {
          newTree.splice(overIndex, 0, movedItem);
        }
      } else {
        const insertNearOver = (treeItems: MenuItem[]): MenuItem[] => {
          return treeItems.map(item => {
            if (item.id === overParentId && item.children) {
              const overIdx = item.children.findIndex(c => c.id === over.id);
              if (overIdx !== -1) {
                const newChildren = [...item.children];
                newChildren.splice(overIdx, 0, movedItem);
                return { ...item, children: newChildren };
              }
            }
            if (item.children) {
              return { ...item, children: insertNearOver(item.children) };
            }
            return item;
          });
        };
        newTree = insertNearOver(newTree);
      }
    }

    // Update tree state
    onItemsChange(newTree);

    // Compute reorder payload and notify parent
    const reorderData = computeReorderPayload(newTree);
    onReorder(reorderData);
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={itemIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-1">
          {flattened.map(({ item, depth }) => (
            <SortableTreeItem 
              key={item.id} 
              item={item} 
              depth={depth}
              onSelect={onSelect}
              onAddChild={onAddChild}
              selectedId={selectedId}
              onToggleExpand={onToggleExpand}
              isExpanded={expandedIds.has(item.menu_id)}
              isDropTarget={dropTargetId === item.id}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
