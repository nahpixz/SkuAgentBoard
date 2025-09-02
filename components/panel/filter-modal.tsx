import React, { useState, useEffect, JSX, ComponentType } from 'react';
import { X, ArrowUpDown, Percent, Clock, Package, Tag, Gift, Gamepad2, Smartphone, Heart } from 'lucide-react';
import { PriceRangeFilter,PriceRangeFilterProps } from './price-range-filter';
import { SortButton, SortDirection, SortOption } from './sort-button';
import { ModalOverlay } from './modal-overlay';
import { DB } from '../../entrypoints/panel/db';
import { _create, setFn } from "@/lib/utils";
import { C2C_LIST } from '@/entrypoints/panel/api';
type selectAbleCategory  =  C2C_LIST.CategoryType | ''

const FilterDefaultOptions = {
  priceRange: [0, 50] as [number,number],
  sortOption:'' as SortOption,
  sortDirection:'asc' as SortDirection,
  showOnlyInStock:false,
  discountRange: 100,
  updateTimeRange: 7,
  selectedCategory: '' as selectAbleCategory, // 空字符串表示不筛选分类
  showOnlyFavorites: false // 仅显示收藏的商品
}
const FilterDefaultState = {
  skuPriceRange:[NaN,NaN] as [number,number],
  pending:FilterDefaultOptions,
  applied:FilterDefaultOptions as typeof FilterDefaultOptions | null
}
//全局单例 - 不再包含开关逻辑
//完全通过isOpen和onClose属性控制，不再通过内部store状态控制开关
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
  _onCategoryChange:(category:selectAbleCategory)=> set(state=>({
    pending:{...state.pending,selectedCategory:category}
  })),
  _toggleShowOnlyFavorites:()=> set(state=>({
    pending:{...state.pending,showOnlyFavorites:!state.pending.showOnlyFavorites}
  })),
  _resetPending:()=>set(state=>({
    pending:state.applied || FilterDefaultOptions
  })),
  _reset:()=>set(state=>({
    pending:FilterDefaultOptions,
    applied:FilterDefaultOptions
  })),
  _apply:()=>set(state=>({
    applied:state.pending,
  })),
  _handleSortChange:(option: SortOption, direction: SortDirection)=>set(state=>({
    pending:{
      ...state.pending,
      sortOption:option,
      sortDirection:state.pending.sortOption == option ? direction : 'asc',
    },
  }))
}));


export interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterModal({ isOpen, onClose }: FilterModalProps) {
  const { 
    pending,skuPriceRange,
    _handleSortChange,
    _onDiscountRangeChange,_onUpdateTimeRangeChange,_toggleShowOnlyInStock,
    _onCategoryChange,_toggleShowOnlyFavorites,
    _apply,_reset,_resetPending
  }  = useGlobalFilterStore();
  const {priceRange,sortOption,sortDirection,discountRange,updateTimeRange,showOnlyInStock,selectedCategory,showOnlyFavorites} = pending;
  const [skuGroupOptions,setSkuGroupOptions] = useState<PriceRangeFilterProps['groupOptions']|null>(null);
  
  // 当模态框打开时，重置pending状态为上次应用的状态
  useEffect(() => {
    if (isOpen) {
      _resetPending();
    }
  }, [isOpen]);
  
  useEffect(()=>{
    if (isOpen) {
      DB.getSkuWithoutC2C().then(skus=>{
        const prices = skus.map(item => item.marketPrice/100).sort((a, b) => a - b) || [0];
        const skuMin = prices[0]                //Math.min(...prices);
        const skuMax = prices[prices.length-1] //Math.max(...prices) || 100;
        useGlobalFilterStore.setState({
          skuPriceRange:[skuMin,skuMax]
        })

        const groupOpt:PriceRangeFilterProps['groupOptions'] = {
          priceGroups: [],
          groupGrowStart: 250,
          groupGrowEnd: 3000,
          groupGrowCout: 12,
          priceUnit: 10
        }
        const priceGroups = calcPriceGroups(prices,skuMax,groupOpt);
        setSkuGroupOptions({
          ...groupOpt,
          priceGroups,
        })
      })
    }
  },[isOpen])
  
  // 处理关闭
  const handleClose = () => {
    _resetPending();
    onClose();
  };
  
  // 处理应用
  const handleApply = () => {
    _apply();
    onClose();
  };
  
  // 处理重置
  const handleReset = () => {
    _reset();
    onClose();
  };

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={handleClose}
      contentClassName="mt-8 bg-white/95 rounded-xl shadow-2xl w-full md:max-w-md lg:max-w-lg xl:max-w-xl mx-4 overflow-hidden"
    >
        <div className="relative p-4 max-h-[88vh] overflow-y-auto">
          {/* 关闭按钮 */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>

          {/* 分类筛选 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                商品分类
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <CategoryButton category={''} onClick={_onCategoryChange} selected={selectedCategory}/>
              <CategoryButton category={C2C_LIST.CategoryType.Figure} onClick={_onCategoryChange} selected={selectedCategory}/>
              <CategoryButton category={C2C_LIST.CategoryType.Goods} onClick={_onCategoryChange} selected={selectedCategory}/>
              <CategoryButton category={C2C_LIST.CategoryType.Model} onClick={_onCategoryChange} selected={selectedCategory}/>
              <CategoryButton category={C2C_LIST.CategoryType._3C} onClick={_onCategoryChange} selected={selectedCategory}/>
            </div>
          </div>
          
          {/* 排序部分 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
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
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
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
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
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
          
          <div className="mb-4">
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
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div 
                className="relative inline-block w-10 mr-2 align-middle select-none"
                onClick={() => _toggleShowOnlyFavorites()}
              >
                <input 
                  type="checkbox" 
                  id="showOnlyFavorites" 
                  checked={showOnlyFavorites}
                  onChange={(e) => _toggleShowOnlyFavorites()}
                  className="sr-only"
                />
                <div className="block h-5 w-10 rounded-full bg-gray-300 cursor-pointer"
                  style={{
                    background: showOnlyFavorites ? '#786DF6' : '#D1D5DB'
                  }}
                ></div>
                <div 
                  className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out"
                  style={{
                    transform: showOnlyFavorites ? 'translateX(20px)' : 'translateX(0)',
                    border: showOnlyFavorites ? '2px solid #786DF6' : '2px solid #D1D5DB'
                  }}
                ></div>
              </div>
              <label htmlFor="showOnlyFavorites" className="text-sm font-medium text-gray-700 flex items-center gap-1.5 cursor-pointer">
                <Heart className="h-3.5 w-3.5" />
                只显示收藏商品
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button 
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 text-xs rounded-lg transition-colors"
              onClick={handleReset}
            >
              重置
            </button>
            <button 
              className="bg-[#786DF6] hover:bg-[#6258D4] text-white px-4 py-2 text-xs rounded-lg transition-colors"
              onClick={handleApply}
            >
              应用筛选
            </button>
          </div>
        </div>
    </ModalOverlay>
  );
}

function CategoryButton({category,selected,onClick}:{category:selectAbleCategory,selected:selectAbleCategory,onClick:(category:selectAbleCategory)=>void}){

  const passProps = <T extends {}>(Comp: ComponentType<T>) => 
                      (props: T) => <Comp {...props}/>;
  const isSelected = selected === category;
  function slots():[string,(prop:any)=>JSX.Element,string]{
    switch (category) {
      case C2C_LIST.CategoryType.Figure:
              return ['手办',passProps(Gift)      ,isSelected ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600 hover:bg-pink-200'];
      case C2C_LIST.CategoryType.Goods:
              return ['周边',passProps(Package)   ,isSelected ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'];
      case C2C_LIST.CategoryType.Model:
              return ['模型',passProps(Gamepad2)  ,isSelected ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'];
      case C2C_LIST.CategoryType._3C:
              return ['数码',passProps(Smartphone),isSelected ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600 hover:bg-green-200'];
      default:return ['全部',passProps(Tag)       , isSelected ? 'bg-[#786DF6] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'];
    }
  }

  const [title,GIcon,bgColor] = slots();

  return (<button
      className={`py-1 rounded-lg text-xs font-medium transition-colors flex flex-row items-center justify-center gap-1 ${bgColor}`}
      onClick={() => onClick(category)}
    >
      <GIcon className="h-3.5 w-3.5" />
      <span>{title}</span>
  </button>);
}

//计算价格区间分组
function calcPriceGroups(sortedPrices:number[],maxItemPrice:number,groupOpt:PriceRangeFilterProps['groupOptions']) {
  const {groupGrowStart,groupGrowEnd,groupGrowCout,priceUnit} = groupOpt;
  const groups: { [key: number]: number } = {};
  // 小于groupGrowPrice的均匀分组
  const groupCount = Math.ceil(groupGrowStart / priceUnit);
  for (let i = 0; i <= groupCount; i++) {
    groups[i * priceUnit] = 0;
  }

  // 大于groupGrowPrice的非均匀分组 - 使用指数增长的间隔
  if (maxItemPrice > groupGrowStart) {
    const highPrices = sortedPrices;

    if (highPrices.length > 0) {
      // const maxHighPrice = highPrices[highPrices.length-1];
      groups[Math.round(highPrices[highPrices.length-1])] = 0;
      const priceRange = groupGrowEnd - groupGrowStart;

      // 创建8个非均匀分组来覆盖200+的价格范围
      const groupCount = groupGrowCout;
      for (let i = 0; i < groupCount; i++) {
        // 使用指数函数创建非均匀间隔
        const pows = Math.log(priceRange/priceUnit)/Math.log(groupGrowCout); // 最小间距为priceUnit
        const ratio = Math.pow(i / (groupCount - 1),pows); 
        const groupPrice = groupGrowStart + ratio * priceRange;
        // console.log('ratio,prices',ratio,groupPrice)
        groups[Math.round(groupPrice)] = 0;
      }
      // console.log('groups',Object.keys(groups).filter(x=> x>240 ))
    }
  }
  

  // 统计每个价格段的商品数量
  sortedPrices.forEach(price => {
    let groupKey;

    if (price <= groupGrowStart) {
      groupKey = Math.floor(price / priceUnit) * priceUnit;
    } else {
      // 找到最接近的高价分组
      const highPriceGroups = Object.keys(groups)
        .map(Number)
        .filter(p => p > groupGrowStart)
        .sort((a, b) => a - b);

      groupKey = highPriceGroups.reduce((closest, current) => {
        return Math.abs(current - price) < Math.abs(closest - price) ? current : closest;
      }, highPriceGroups[0] || groupGrowStart);
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
      if (isAllDisabled(item)) return false;
    }
    
    // 只显示收藏商品
    if (appliedOpt?.showOnlyFavorites) {
      if (!item.isFavorited) return false;
    }

    // 价格范围筛选
    const price = item.marketPrice / 100; // 转换为元
    if ((price < appliedOpt.priceRange[0] || price > appliedOpt.priceRange[1])) {
      return false;
    }
    
    // 分类筛选
    if (appliedOpt.selectedCategory && item.category !== appliedOpt.selectedCategory) {
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
        // 计算折扣率 (1 - 平均价/市场价) * 100
        const getAveragePrice = (item: any) => {
          if (!item.c2cLists || item.c2cLists.length === 0) return 0;
          const availableItems = item.c2cLists.filter((c2c: any) => !c2c?.removable);
          if (availableItems.length === 0) return 0;
          const totalPrice = availableItems.reduce((sum: number, c2c: any) => sum + (Number(c2c?.showPrice) || 0), 0);
          return totalPrice / availableItems.length;
        };
        const discountA = a.c2cLists && a.c2cLists.length > 0
          ? (1 - getAveragePrice(a) / (a.marketPrice / 100)) * 100
          : 0;
        const discountB = b.c2cLists && b.c2cLists.length > 0
          ? (1 - getAveragePrice(b) / (b.marketPrice / 100)) * 100
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