import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Trash, X } from 'lucide-react';
import { useSelectStore } from './select-store';
import { useLiveQuery } from 'dexie-react-hooks';
import { DB } from '@/entrypoints/panel/db';


export function SelectModeToolbar({handleSelectAll}:{handleSelectAll: () => void}) {
  // const skuList = useLiveQuery(() => DB.getSkuList());
  const {
    hasSelectedItems,
    hasSelectedC2C,
    selectAll,
    deleteSelected,
    deleteSelectedC2C,
    toggleSelectMode
  } = useSelectStore();
  
  // const handleSelectAll = () => {
  //   if (skuList) {
  //     selectAll(skuList);
  //   }
  // };
  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-2 bg-white/70 backdrop-blur-md shadow-sm border-b flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-md text-xs flex items-center gap-1 border-gray-200 bg-white/80"
          onClick={handleSelectAll}
        >
          <Check className="h-3.5 w-3.5" />
          全选
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-md text-xs flex items-center gap-1 border-gray-200 bg-white/80"
          onClick={deleteSelected}
          disabled={!hasSelectedItems}
        >
          <Trash className="h-3.5 w-3.5" />
          删除选中商品
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-md text-xs flex items-center gap-1 border-gray-200 bg-white/80"
          onClick={deleteSelectedC2C}
          disabled={!hasSelectedC2C}
        >
          <X className="h-3.5 w-3.5" />
          删除选中c2c库存
        </Button>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="rounded-md text-xs flex items-center gap-1 text-gray-500"
        onClick={toggleSelectMode}
      >
        取消
      </Button>
    </div>
  );
}