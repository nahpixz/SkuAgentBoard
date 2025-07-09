import React from 'react';
import { X, ArrowUpDown, Percent, Clock, Package } from 'lucide-react';
import { PriceRangeFilter } from './price-range-filter';
import { SortButton } from './sort-button';
import { DB } from '../../entrypoints/panel/db';

type SortOption = 'price' | 'discount' | 'stock' | 'updateTime';
type SortDirection = 'asc' | 'desc';

interface FilterModalProps {
  isOpen: boolean;
  skuList: DB.skuItem[] | undefined;
  skuPriceRange: [number, number];
  sortOption: SortOption;
  sortDirection: SortDirection;
  showOnlyInStock: boolean;
  priceRange: [number, number];
  discountRange: number;
  updateTimeRange: number;
  onSortOptionChange: (option: SortOption) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  onShowOnlyInStockChange: (value: boolean) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onDiscountRangeChange: (value: number) => void;
  onUpdateTimeRangeChange: (value: number) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}

export function FilterModal({
  isOpen,
  skuList,
  skuPriceRange,
  sortOption,
  sortDirection,
  showOnlyInStock,
  priceRange,
  discountRange,
  updateTimeRange,
  onSortOptionChange,
  onSortDirectionChange,
  onShowOnlyInStockChange,
  onPriceRangeChange,
  onDiscountRangeChange,
  onUpdateTimeRangeChange,
  onApply,
  onReset,
  onClose
}: FilterModalProps) {
  if (!isOpen) return null;

  const handleSortChange = (option: SortOption, direction: SortDirection) => {
    if (sortOption === option) {
      onSortDirectionChange(direction);
    } else {
      onSortOptionChange(option);
      onSortDirectionChange('asc');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="mt-8 bg-white/95 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-4 max-h-[88vh] overflow-y-auto">
          {/* 关闭按钮 */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
          
          {/* 排序部分 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5" />
                排序方式
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <SortButton
                option="price"
                label="价格"
                currentSortOption={sortOption}
                currentSortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
              <SortButton
                option="discount"
                label="折扣"
                currentSortOption={sortOption}
                currentSortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
              <SortButton
                option="stock"
                label="库存"
                currentSortOption={sortOption}
                currentSortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
              <SortButton
                option="updateTime"
                label="更新时间"
                currentSortOption={sortOption}
                currentSortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
            </div>
          </div>
          
          {/* 筛选部分 */}
          <PriceRangeFilter
            items={skuList || []}
            minPrice={priceRange[0]}
            maxPrice={priceRange[1]}
            maxItemPrice={skuPriceRange[1]}
            onRangeChange={(min, max) => onPriceRangeChange([min, max])}
          />
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5" />
                折扣范围
              </span>
              <span className="text-xs text-gray-500">
                0-100%
              </span>
            </div>
            <div className="px-1">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={discountRange || 100}
                onChange={(e) => onDiscountRangeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#786DF6]"
              />
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>0%</span>
                <span>{discountRange || 100}%</span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                库存更新时间
              </span>
              <span className="text-xs text-gray-500">
                0-7天内
              </span>
            </div>
            <div className="px-1">
              <input 
                type="range" 
                min="0" 
                max="7" 
                value={updateTimeRange || 7}
                onChange={(e) => onUpdateTimeRangeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#786DF6]"
              />
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>当天</span>
                <span>{updateTimeRange || 7}天内</span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <div 
                className="relative inline-block w-10 mr-2 align-middle select-none"
                onClick={() => onShowOnlyInStockChange(!showOnlyInStock)}
              >
                <input 
                  type="checkbox" 
                  id="showOnlyInStock" 
                  checked={showOnlyInStock}
                  onChange={(e) => onShowOnlyInStockChange(e.target.checked)}
                  className="sr-only"
                />
                <div className="block h-5 w-10 rounded-full bg-gray-300 cursor-pointer"
                  style={{
                    background: showOnlyInStock ? '#786DF6' : '#D1D5DB'
                  }}
                ></div>
                <div 
                  className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out"
                  style={{
                    transform: showOnlyInStock ? 'translateX(20px)' : 'translateX(0)',
                    border: showOnlyInStock ? '2px solid #786DF6' : '2px solid #D1D5DB'
                  }}
                ></div>
              </div>
              <label htmlFor="showOnlyInStock" className="text-sm font-medium text-gray-700 flex items-center gap-1.5 cursor-pointer">
                <Package className="h-3.5 w-3.5" />
                只显示有货商品
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button 
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 text-xs rounded-lg transition-colors"
              onClick={onReset}
            >
              重置
            </button>
            <button 
              className="bg-[#786DF6] hover:bg-[#6258D4] text-white px-4 py-2 text-xs rounded-lg transition-colors"
              onClick={onApply}
            >
              应用筛选
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}