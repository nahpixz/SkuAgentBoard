import React from 'react';
import './index.css'
import { Card } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Info, Tag } from 'lucide-react';
import { C2C_DETAIL, MALL_DETAIL } from '../../entrypoints/panel/api';
import { JumpTo, ToC2cSearch } from '../../entrypoints/panel/tasks';
import { DB } from '../../entrypoints/panel/db';
import { useSelectStore } from './select-store';

const IMGBGURL = "https://gw.alicdn.com/imgextra/i2/O1CN01yQ3RYl1EqAGI2JrGE_!!6000000000402-2-tps-144-144.png_110x10000.jpg_.webp"

interface ProductCardProps {
  item: DB.skuItem;
  onOpenInventoryCheck: (item: DB.skuItem) => void;
}

export function ProductCard({
  item,
  onOpenInventoryCheck
}: ProductCardProps) {
  // 使用select store
  const { 
    isSelectMode, 
    selectedItems, 
    selectedC2CItems,
    toggleSelectItem,
    toggleSelectC2C
  } = useSelectStore();
  
  // 判断当前商品是否被选中
  const isSelected = selectedItems[item.itemsId] || false;
  
  // 处理选择/取消选择商品的事件包装函数
  const handleToggleSelect = (itemId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止事件冒泡
    toggleSelectItem(itemId);
  };
  
  // 处理选择/取消选择C2C库存的事件包装函数
  const handleToggleSelectC2C = (c2cItemId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止事件冒泡
    toggleSelectC2C(c2cItemId);
  };
  const allDisabled = isAllDisabled(item);

  function isAllDisabled(item: DB.skuItem) {
    return item.c2cLists && item.c2cLists.length > 0 && 
           item.c2cLists.every(c2c => c2c?.removable === true);
  }

  function getItemLabel(it: DB.skuItem) {
    if (!it.c2cLists) return '¥ ?';
    return `¥ ${it.c2cLists?.sort((a, b) => a!.price - b!.price)?.[0]?.showPrice}`;
  }

  function getLowestPrice(it: DB.skuItem) {
    if (!it.c2cLists || it.c2cLists.length === 0) return null;
    const availableItems = it.c2cLists.filter(c2c => !c2c?.removable);
    if (availableItems.length === 0) return null;
    return availableItems.sort((a, b) => a!.price - b!.price)?.[0]?.showPrice;
  }

  return (
    <Card 
      key={item.itemsId} 
      className={`overflow-hidden py-0 gap-0 border transition-all hover:shadow-md 
        ${allDisabled ? 'opacity-60 grayscale border-gray-200' : 'border-gray-200 hover:border-[#786DF6]/50'}
        ${isSelected ? 'ring-2 ring-[#786DF6] border-transparent' : ''}`}
    >
      <div className="relative bg-[#F5F5F5] h-36">
        {/* 选择模式下显示复选框 */}
        {isSelectMode && (
          <div 
            className="absolute top-2 left-2 z-10"
            onClick={(e) => handleToggleSelect(item.itemsId, e)}
          >
            <div className="h-6 w-6 bg-white/90 rounded-full flex items-center justify-center shadow-sm border border-gray-200">
              <Checkbox 
                checked={isSelected}
                className="h-4 w-4 rounded-full data-[state=checked]:bg-[#786DF6] border-gray-300"
              />
            </div>
          </div>
        )}
        
        <img 
          onClick={(e) => isSelectMode ? handleToggleSelect(item.itemsId, e) : onOpenInventoryCheck(item)}
          title={isSelectMode ? "点击选择" : "点击检查库存"}
          src={`https:${item.img}@522w_522h_85q.webp`} 
          alt={item.name} 
          className="w-full h-full object-contain mix-blend-multiply cursor-pointer" 
        />
        
        {/* 合并的计数和价格标签 */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <div 
              onClick={(e) => isSelectMode ? e.stopPropagation() : ToC2cSearch(item.skuId)}
              className="absolute bottom-2 right-2 bg-gradient-to-r from-black/80 to-black/70 text-white px-2.5 py-1 rounded-full text-xs backdrop-blur-sm cursor-pointer hover:from-[#786DF6]/90 hover:to-[#9B8BF7]/90 transition-all duration-200 flex items-center gap-1.5 shadow-lg border border-white/10"
              title="跳转s-wg搜索库存"
            >
              <span className="font-medium">x{item.c2cItemsIds.length}</span>
              {getLowestPrice(item) && (
                <>
                  <div className="w-px h-3 bg-white/30" />
                  <span className="font-semibold text-yellow-200">¥{getLowestPrice(item)}</span>
                </>
              )}
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 p-3 rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">可用库存列表</h4>
              {getLowestPrice(item) && (
                <span className="text-xs text-[#786DF6] font-semibold bg-[#786DF6]/10 px-2 py-0.5 rounded-full">
                  最低 ¥{getLowestPrice(item)}
                </span>
              )}
            </div>
            <ul className="text-sm space-y-1 max-h-60 overflow-y-auto">
              {item.c2cLists && item.c2cLists
              .filter(x => !x?.removable)
              .map((c2c) => {
                const isC2CSelected = c2c?.c2cItemsId && selectedC2CItems[c2c.c2cItemsId];
                return (
                <li key={c2c?.c2cItemsId} 
                  onClick={(e) => isSelectMode && c2c?.c2cItemsId ? handleToggleSelectC2C(c2c.c2cItemsId, e) : c2c?.c2cItemsId && JumpTo(C2C_DETAIL.URL(c2c?.c2cItemsId))}
                  className={`flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-gray-50 
                    ${c2c?.removable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${isC2CSelected ? 'bg-[#786DF6]/10' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {isSelectMode && c2c?.c2cItemsId ? (
                      <div className="h-6 w-6 flex items-center justify-center">
                        <Checkbox 
                          checked={Boolean(isC2CSelected)}
                          className="h-4 w-4 rounded-full data-[state=checked]:bg-[#786DF6] border-gray-300"
                        />
                      </div>
                    ) : (
                      <Avatar className="h-6 w-6 border border-gray-200">
                        {c2c?.uface ? (
                          <AvatarImage src={`${c2c.uface}@72w_72h_85q.webp`} alt={c2c.uname || '用户'} />
                        ) : (
                          <AvatarFallback className="text-[10px] bg-gray-100 text-gray-500">
                            {c2c?.uname?.substring(0, 2) || '用户'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    )}
                    <span className={`text-xs ${c2c?.removable ? 'text-gray-400' : 'text-gray-700'}`}>
                      {c2c?.uname}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${c2c?.removable ? 'text-gray-400' : 'text-[#786DF6]'}`}>
                    ¥{c2c?.showPrice}
                  </span>
                </li>
              )})}
            </ul>
          </HoverCardContent>
        </HoverCard>
        
        {/* 悬浮售价格标签 */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="absolute bottom-1 left-2 z-20">
              {true ? (
                <div className={`h-6 ${true
                  ?'rounded-md before:opacity-33'
                  :'rounded-full w-6 before:opacity-100'
                } 
                  goofish-card-button bg-gradient-to-r from-[#FBE650]/90 to-[#FBE650]/3 text-[#786DF6]
                  backdrop-blur-[1px] pl-1.5 pr-5 py-0.5  
                  text-xs font-semibold shadow-lg border border-white/20 flex items-center gap-1.5
                   hover:shadow-xl transition-all duration-200`}
                >
                  {/* <span>&nbsp;</span>  */}
                  <span>¥{111.11}</span>
                   {/* <span>¥{getLowestPrice(item)}</span> */}
                  {/* transparent  #786DF6*/}
                </div>
              ) : (
                <button 
                  className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group"
                  style={{
                    backgroundImage: `url(${IMGBGURL})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#786DF6]/20 to-[#9B8BF7]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </button>
              )}
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto p-2 rounded-lg shadow-md">
            <span className="text-xs">
              {getLowestPrice(item) ? `最低价格: ¥${getLowestPrice(item)}` : '暂无价格信息'}
            </span>
          </HoverCardContent>
        </HoverCard>

        <HoverCard>
          <HoverCardTrigger asChild>
            <button 
              onClick={() => JumpTo(MALL_DETAIL.URL(item.itemsId))}
              className="absolute top-2 right-2 bg-black/50 text-white/90 px-1.5 py-0.5 text-[10px] rounded-sm backdrop-blur-sm hover:bg-black/70 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Info className="h-2.5 w-2.5 opacity-70" />
              <span>¥{item.marketPrice/100}</span>
            </button>
          </HoverCardTrigger>
          <HoverCardContent className="w-auto p-2 rounded-lg shadow-md">
            <span className="text-xs">点击跳转会员购:{item.itemsId}</span>
          </HoverCardContent>
        </HoverCard>
      </div>
      
      <div className="p-2">
        <div className="flex items-center gap-1.5">
          <HoverCard>
            <HoverCardTrigger asChild>
              <span className="text-xs font-medium truncate cursor-help">
                {item.name}
              </span>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-2 rounded-lg shadow-md">
              <p className="text-sm">{item.name}</p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
    </Card>
  );
}

