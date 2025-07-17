import { X, ArrowUpDown, Percent, Clock, Package } from 'lucide-react';
import { PriceRangeFilter,PriceRangeFilterProps } from './price-range-filter';
import { SortButton, SortDirection, SortOption } from './sort-button';
import { ModalOverlay } from './modal-overlay';
import { DB } from '../../entrypoints/panel/db';
import { _create, setFn } from "@/lib/utils";

const FilterDefaultOptions = {
  priceRange: [0, 50] as [number,number],
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
  applied:FilterDefaultOptions as typeof FilterDefaultOptions | null
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


export function FilterModal() {
  const { 
    isOpen,pending,skuPriceRange,
    _closeFilter,_handleSortChange,
    _onDiscountRangeChange,_onUpdateTimeRangeChange,_toggleShowOnlyInStock,
    _apply,_reset
  }  = useGlobalFilterStore();
  const {priceRange,sortOption,sortDirection,discountRange,updateTimeRange,showOnlyInStock} = pending;
  const [skuGroupOptions,setSkuGroupOptions] = useState<PriceRangeFilterProps['groupOptions']|null>(null);
  useEffect(()=>{
    DB.getSkuWithoutC2C().then(skus=>{
      const prices = skus.map(item => item.marketPrice/100) || [0];
      const skuMin = Math.min(...prices);
      const skuMax = Math.max(...prices) || 100;
      useGlobalFilterStore.setState({
        skuPriceRange:[skuMin,skuMax]
      })
      setSkuGroupOptions({
        priceGroups:calcPriceGroups(skus,skuMax,250,10),
        groupGrowPrice:250,
        priceUnit:10
      })
    })
  },[isOpen])

  return isOpen && (
    <ModalOverlay
      isOpen={isOpen}
      onClose={_closeFilter}
      contentClassName="mt-8 bg-white/95 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
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
          {skuGroupOptions && <PriceRangeFilter
            minPrice={priceRange[0]}
            maxPrice={priceRange[1]}
            onRangeChange={(min, max) => useGlobalFilterStore.setState({pending:{...pending,priceRange:[min, max]}})}
            maxItemPrice={skuPriceRange[1]}
            groupOptions={skuGroupOptions}
          />}
          
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
    </ModalOverlay>
  );
}

//计算价格区间分组
function calcPriceGroups(items:DB.skuItem[],maxItemPrice:number,groupGrowPrice:number,priceUnit:number) {
  const groups: { [key: number]: number } = {};
  // 小于groupGrowPrice的均匀分组
  const groupCount = Math.ceil(groupGrowPrice / priceUnit);
  for (let i = 0; i <= groupCount; i++) {
    groups[i * priceUnit] = 0;
  }

  // 大于groupGrowPrice的非均匀分组 - 使用指数增长的间隔
  if (maxItemPrice > groupGrowPrice) {
    const highPriceItems = items.filter(item => item.marketPrice / 100 > groupGrowPrice);
    const highPrices = highPriceItems.map(item => item.marketPrice / 100).sort((a, b) => a - b);

    if (highPrices.length > 0) {
      const minHighPrice = Math.min(...highPrices);
      const maxHighPrice = Math.max(...highPrices);
      const priceRange = maxHighPrice - groupGrowPrice;

      // 创建8个非均匀分组来覆盖200+的价格范围
      const groupCount = 8;
      for (let i = 0; i < groupCount; i++) {
        // 使用指数函数创建非均匀间隔
        const ratio = Math.pow(i / (groupCount - 1), 1.5); // 指数为1.5，使间隔逐渐增大
        const groupPrice = groupGrowPrice + ratio * priceRange;
        groups[Math.round(groupPrice)] = 0;
      }
    }
  }

  // 统计每个价格段的商品数量
  items.forEach(item => {
    const price = item.marketPrice / 100;
    let groupKey;

    if (price <= groupGrowPrice) {
      groupKey = Math.floor(price / priceUnit) * priceUnit;
    } else {
      // 找到最接近的高价分组
      const highPriceGroups = Object.keys(groups)
        .map(Number)
        .filter(p => p > groupGrowPrice)
        .sort((a, b) => a - b);

      groupKey = highPriceGroups.reduce((closest, current) => {
        return Math.abs(current - price) < Math.abs(closest - price) ? current : closest;
      }, highPriceGroups[0] || groupGrowPrice);
    }

    groups[groupKey] = (groups[groupKey] || 0) + 1;
  });

  return Object.entries(groups)
    .map(([price, count]) => ({ price: Number(price), count }))
    .filter((group) => group.count > 0) // 只保留有数据的分组
    .sort((a, b) => a.price - b.price);
}

function isAllDisabled(item: DB.skuItem) {
  return item.c2cLists && item.c2cLists.length > 0 &&
    item.c2cLists.every(c2c => c2c?.removable === true);
}
export function FilterAndSort(skuList: DB.skuItem[]){
  // if (!skuList) return [];
  const appliedOpt = useGlobalFilterStore.getState().applied;
  if (!appliedOpt) return skuList;

  const filteredItems = skuList.filter(item => {
    // 只显示有货商品
    if (appliedOpt?.showOnlyInStock) {
      return !isAllDisabled(item);
    }

    // 价格范围筛选
    const price = item.marketPrice / 100; // 转换为元
    if ((price < appliedOpt.priceRange[0] || price > appliedOpt.priceRange[1])) {
      return false;
    }

    // 折扣范围筛选
    // if (appliedDiscountRange < 100) {
    //   // 计算折扣率 (1 - 最低价/市场价) * 100
    //   const lowestPrice = item.c2cLists && item.c2cLists.length > 0 
    //     ? parseFloat(item.c2cLists.sort((x, y) => (x?.price || 0) - (y?.price || 0))[0]?.showPrice || '0')
    //     : 0;
    //   const marketPrice = item.marketPrice / 100;
    //   const discount = marketPrice > 0 ? (1 - lowestPrice / marketPrice) * 100 : 0;

    //   if (discount > appliedDiscountRange) return false;
    // }

    // 库存更新时间筛选
    // if (appliedUpdateTimeRange < 7 && item.c2cInfosLastUpdateTime) {
    //   const updateTime = new Date(item.c2cInfosLastUpdateTime).getTime();
    //   const now = new Date().getTime();
    //   const daysDiff = Math.floor((now - updateTime) / (1000 * 60 * 60 * 24));

    //   if (daysDiff > appliedUpdateTimeRange) return false;
    // }

    return true;
  });

  if (!appliedOpt.sortOption) return filteredItems;
  // 排序（使用已应用的排序状态） 
  return filteredItems.sort((a, b) => {
    let valueA, valueB;

    switch (appliedOpt.sortOption) {
      case 'price':
        valueA = a.marketPrice;
        valueB = b.marketPrice;
        break;
      case 'discount':
        // 计算折扣率 (1 - 最低价/市场价) * 100
        const discountA = a.c2cLists && a.c2cLists.length > 0
          ? (1 - parseFloat(a.c2cLists.sort((x, y) => (x?.price || 0) - (y?.price || 0))[0]?.showPrice || '0') / (a.marketPrice / 100)) * 100
          : 0;
        const discountB = b.c2cLists && b.c2cLists.length > 0
          ? (1 - parseFloat(b.c2cLists.sort((x, y) => (x?.price || 0) - (y?.price || 0))[0]?.showPrice || '0') / (b.marketPrice / 100)) * 100
          : 0;
        valueA = discountA;
        valueB = discountB;
        break;
      case 'stock':
        valueA = a.c2cItemsIds.length;
        valueB = b.c2cItemsIds.length;
        break;
      case 'updateTime':
        valueA = a.c2cInfosLastUpdateTime || 0;
        valueB = b.c2cInfosLastUpdateTime || 0;
        break;
      default:
        return 0;
    }

    // 根据排序方向返回结果
    return appliedOpt.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
  });
};



export function searchFilter(){

      // 获取搜索状态
    // const { searchQuery, searchType } = useSearchStore();
    
    //   // 如果有搜索查询且是本地搜索，应用搜索过滤
    // if (searchQuery && searchType === 'local') {
    //   const query = searchQuery.toLowerCase();
    //   filteredItems = filteredItems.filter(item => 
    //     item.name.toLowerCase().includes(query) ||
    //     item.skuId.toString().includes(query)
    //   );
    // }
}