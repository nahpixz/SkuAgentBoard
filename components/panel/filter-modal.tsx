import { X, ArrowUpDown, Percent, Clock, Package } from 'lucide-react';
import { PriceRangeFilter } from './price-range-filter';
import { SortButton, SortDirection, SortOption } from './sort-button';
import { DB } from '../../entrypoints/panel/db';
import { _create, setFn } from "@/lib/utils";

const FilterDefaultOptions = {
  priceRange: [0, 250] as [number,number],
  sortOption:'' as SortOption,
  sortDirection:'asc' as SortDirection,
  showOnlyInStock:false,
  discountRange: 100,
  updateTimeRange: 7
}
const FilterDefaultState = {
  isOpen: false,
  skuPriceRange:[NaN,NaN] as [number,number],
  pending:FilterDefaultOptions,
  applied:null as typeof FilterDefaultOptions | null
}
//全局单例
export const useGlobalFilterStore = _create((set:setFn<typeof FilterDefaultState>) => ({
  ...FilterDefaultState,
  _onDiscountRangeChange:(value:number)=> set(state=>({
    pending:{...state.pending,discountRange:value}
  })),
  _onUpdateTimeRangeChange:(value:number)=> set(state=>({
    pending:{...state.pending,updateTimeRange:value}
  })),
  _toggleShowOnlyInStock:()=> set(state=>({
    pending:{...state.pending,showOnlyInStock:!state.pending.showOnlyInStock}
  })),
  _closeFilter:()=> set(state=>({
    isOpen:false,
    // priceRange:state.appliedPriceRange || [0,state.skuPriceRange[1]||250]
    pending:state.applied || {
      ...FilterDefaultOptions,
      priceRange:[0,state.skuPriceRange[1]||250],
    }
  })),
  _resetSkuPriceRange:(min:number,max:number)=> set({
    skuPriceRange:[min,max],
  }),
  _reset:()=>set(state=>({
    isOpen:false,
    pending:{
      ...FilterDefaultOptions,
      priceRange:[0,state.skuPriceRange[1]||250],
    },
    applied:null
  })),
  _apply:()=>set(state=>({
    isOpen:false,
    applied:state.pending,
  })),
  _handleSortChange:(option: SortOption, direction: SortDirection)=>set(state=>({
    pending:{
      ...state.pending,
      sortOption:option,
      sortDirection:state.pending.sortOption == option ? direction : 'asc',
    },
  })),
}));

interface FilterModalProps {
  skuList: DB.skuItem[] | undefined;
}

export function FilterModal({
  skuList,
}: FilterModalProps) {
  const { 
    isOpen,pending,skuPriceRange,
    _closeFilter,_handleSortChange,
    _onDiscountRangeChange,_onUpdateTimeRangeChange,_toggleShowOnlyInStock,
    _apply,_reset
  }  = useGlobalFilterStore();
  const {priceRange,sortOption,sortDirection,discountRange,updateTimeRange,showOnlyInStock} = pending;
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center z-50"
      onClick={_closeFilter}
    >
      <div 
        className="mt-8 bg-white/95 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-4 max-h-[88vh] overflow-y-auto">
          {/* 关闭按钮 */}
          <button 
            onClick={_closeFilter}
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
                onSortChange={_handleSortChange}
              />
              <SortButton
                option="discount"
                label="折扣"
                currentSortOption={sortOption}
                currentSortDirection={sortDirection}
                onSortChange={_handleSortChange}
              />
              <SortButton
                option="stock"
                label="库存"
                currentSortOption={sortOption}
                currentSortDirection={sortDirection}
                onSortChange={_handleSortChange}
              />
              <SortButton
                option="updateTime"
                label="更新时间"
                currentSortOption={sortOption}
                currentSortDirection={sortDirection}
                onSortChange={_handleSortChange}
              />
            </div>
          </div>
          
          {/* 筛选部分 */}
          <PriceRangeFilter
            items={skuList || []}
            minPrice={priceRange[0]}
            maxPrice={priceRange[1]}
            maxItemPrice={skuPriceRange[1]}
            onRangeChange={(min, max) => useGlobalFilterStore.setState({pending:{...pending,priceRange:[min, max]}})}
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
                onChange={(e) => _onDiscountRangeChange(parseInt(e.target.value))}
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
                onChange={(e) => _onUpdateTimeRangeChange(parseInt(e.target.value))}
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
                onClick={() => _toggleShowOnlyInStock()}
              >
                <input 
                  type="checkbox" 
                  id="showOnlyInStock" 
                  checked={showOnlyInStock}
                  onChange={(e) => _toggleShowOnlyInStock()}
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
              onClick={_reset}
            >
              重置
            </button>
            <button 
              className="bg-[#786DF6] hover:bg-[#6258D4] text-white px-4 py-2 text-xs rounded-lg transition-colors"
              onClick={_apply}
            >
              应用筛选
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}