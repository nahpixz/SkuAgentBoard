import { useEffect, useState } from 'react';
import './App.css';
import { C2C_DETAIL, C2C_LIST, MALL_DETAIL, MARKET_SWG } from './api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Info, Tag, Check, AlertCircle, Clock, ArrowLeft, Search, Settings, Trash, X, Bug, Home, ShoppingCart, Layers, Filter, ArrowUp, ArrowDown, ArrowUpDown, SlidersHorizontal, Percent, Package } from 'lucide-react';
import { DB } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { checkingPromises, HistoryBack, JumpTo, ToC2cSearch, waitForRequest } from './tasks';
import { useSettingsStore } from './store';

let connID = "";
let connTime = 0;
let c2cNextId = "";

let searchNewPromise: Promise<MARKET_SWG.c2cItem[]> | null = null;
type CHECK_STATUS = 'pending' | 'doing' | 'success' | 'failed' | 'disable';

type C2CCheckView={
  removable?:boolean;
  c2cItemsId: number;
  uface:string;
  uname:string;
  showPrice:string;
}

// 筛选和排序的默认值常量
const DEFAULT_FILTER_VALUES = {
  sortOption: 'price' as 'price' | 'discount' | 'stock' | 'updateTime',
  sortDirection: 'asc' as 'asc' | 'desc',
  showOnlyInStock: false,
  priceRange: 100,
  discountRange: 100,
  updateTimeRange: 7
};

function App() {
  // const [c2cData,setC2cData] = useState<C2C_LIST.c2cItem[]>([])
  const skuList = useLiveQuery(() => DB.getSkuList());
  
  const [checkingItem, setCheckingItem] = useState<DB.skuItem | null>(null);
  const [checkingC2Cs, setCheckingC2Cs] = useState<(C2CCheckView|undefined)[]>([]);
  const [checkStatus, setCheckStatus] = useState<{[key: number|string]: CHECK_STATUS}>({});
  const [isCheckingInProgress, setIsCheckingInProgress] = useState(false);
  const [isCheckingComplete, setIsCheckingComplete] = useState(false);

  const [checkMarketOption, setCheckMarketOption] = useState(true);
  const [searchNewOption, setSearchNewOption] = useState(true);

  // 搜索相关状态
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchType, setSearchType] = useState<'remote' | 'local'>('local');
  const [searchQuery, setSearchQuery] = useState('');

  // 设置相关状态
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  // const settingsOptions = useSettingsStore((state) => state);
  const settingsOptions = useSettingsStore();

  // 筛选相关状态
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [sortOption, setSortOption] = useState<'price' | 'discount' | 'stock' | 'updateTime'>(DEFAULT_FILTER_VALUES.sortOption);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(DEFAULT_FILTER_VALUES.sortDirection);
  const [showOnlyInStock, setShowOnlyInStock] = useState(DEFAULT_FILTER_VALUES.showOnlyInStock);
  const [priceRange, setPriceRange] = useState<number>(DEFAULT_FILTER_VALUES.priceRange);
  const [discountRange, setDiscountRange] = useState<number>(DEFAULT_FILTER_VALUES.discountRange);
  const [updateTimeRange, setUpdateTimeRange] = useState<number>(DEFAULT_FILTER_VALUES.updateTimeRange);
  
  // 应用的筛选状态（只有点击应用筛选后才更新）
  const [appliedSortOption, setAppliedSortOption] = useState<'price' | 'discount' | 'stock' | 'updateTime'>(DEFAULT_FILTER_VALUES.sortOption);
  const [appliedSortDirection, setAppliedSortDirection] = useState<'asc' | 'desc'>(DEFAULT_FILTER_VALUES.sortDirection);
  const [appliedShowOnlyInStock, setAppliedShowOnlyInStock] = useState(DEFAULT_FILTER_VALUES.showOnlyInStock);
  const [appliedPriceRange, setAppliedPriceRange] = useState<number>(DEFAULT_FILTER_VALUES.priceRange);
  const [appliedDiscountRange, setAppliedDiscountRange] = useState<number>(DEFAULT_FILTER_VALUES.discountRange);
  const [appliedUpdateTimeRange, setAppliedUpdateTimeRange] = useState<number>(DEFAULT_FILTER_VALUES.updateTimeRange);

  const [hasSelectedItems, setHasSelectedItems] = useState(false);
  const [hasSelectedC2C, setHasSelectedC2C] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{[key: number]: boolean}>({});
  const [selectedC2CItems, setSelectedC2CItems] = useState<{[key: number]: boolean}>({});
  
  // 切换选择模式
  function toggleSelectMode() {
    if (isSelectMode) {
      // 退出选择模式时清空选择
      setIsSelectMode(false);
      setSelectedItems({});
      setSelectedC2CItems({});
      setHasSelectedItems(false);
      setHasSelectedC2C(false);
    } else {
      // 进入选择模式前关闭其他模态窗
      closeAllModals();
      setIsSelectMode(true);
    }
    
    // 检查完成后，更新状态
    setIsCheckingInProgress(false);
    setIsCheckingComplete(true);
  }
  
  // 选择/取消选择商品
  function toggleSelectItem(itemId: number, event: React.MouseEvent) {
    event.stopPropagation(); // 阻止事件冒泡
    
    const newSelectedItems = {...selectedItems};
    newSelectedItems[itemId] = !newSelectedItems[itemId];
    setSelectedItems(newSelectedItems);
    
    // 更新是否有选中商品的状态
    setHasSelectedItems(Object.values(newSelectedItems).some(v => v));
  }
  
  // 选择/取消选择C2C库存
  function toggleSelectC2C(c2cItemId: number, event: React.MouseEvent) {
    event.stopPropagation(); // 阻止事件冒泡
    
    const newSelectedC2CItems = {...selectedC2CItems};
    newSelectedC2CItems[c2cItemId] = !newSelectedC2CItems[c2cItemId];
    setSelectedC2CItems(newSelectedC2CItems);
    
    // 更新是否有选中C2C库存的状态
    setHasSelectedC2C(Object.values(newSelectedC2CItems).some(v => v));
  }
  
  // 选择所有项目
  function handleSelectAll() {
    if (!isSelectMode) {
      toggleSelectMode();
      return;
    }
    
    const newSelectedItems:{[key: number]: boolean} = {};
    skuList?.forEach(item => {
      newSelectedItems[item.itemsId] = true;
    });
    setSelectedItems(newSelectedItems);
    setHasSelectedItems(Boolean(skuList && skuList.length > 0));
  }
  
  // 删除选中商品
  function handleDeleteSelected() {
    // 实现删除选中商品的逻辑
    console.log('删除选中商品', selectedItems);
    setSelectedItems({});
    setHasSelectedItems(false);
  }
  
  // 删除选中c2c库存
  function handleDeleteSelectedC2C() {
    // 实现删除选中c2c库存的逻辑
    console.log('删除选中c2c库存', selectedC2CItems);
    setSelectedC2CItems({});
    setHasSelectedC2C(false);
  }
  
  // 关闭所有模态窗
  function closeAllModals() {
    setIsSearchModalOpen(false);
    setIsSettingsModalOpen(false);
    setIsFilterModalOpen(false);
    
    // 关闭选择模式并清空选择状态
    if (isSelectMode) {
      setIsSelectMode(false);
      setSelectedItems({});
      setSelectedC2CItems({});
      setHasSelectedItems(false);
      setHasSelectedC2C(false);
    }
  }
  
  // 打开设置
  function openSettings() {
    if (isSettingsModalOpen) {
      setIsSettingsModalOpen(false);
    } else {
      closeAllModals();
      setIsSettingsModalOpen(true);
    }
  }
  
  // 打开搜索
  function openSearch() {
    if (isSearchModalOpen) {
      setIsSearchModalOpen(false);
    } else {
      closeAllModals();
      setIsSearchModalOpen(true);
      setSearchQuery('');
    }
  }
  
  // 执行搜索
  function performSearch() {
    console.log('搜索', searchType, searchQuery);
    // 本地搜索直接通过状态过滤，远程搜索需要调用API
    if (searchType === 'remote') {
      // 这里应该调用远程搜索API，但目前只是模拟
      console.log('执行远程搜索', searchQuery);
    }
    setIsSearchModalOpen(false);
  }
  
  // 打开筛选
  function openFilter() {
    if (isFilterModalOpen) {
      setIsFilterModalOpen(false);
    } else {
      closeAllModals();
      setIsFilterModalOpen(true);
    }
  }
  
  // 应用筛选设置
  const applyFilterSettings = () => {
    setAppliedSortOption(sortOption);
    setAppliedSortDirection(sortDirection);
    setAppliedShowOnlyInStock(showOnlyInStock);
    setAppliedPriceRange(priceRange);
    setAppliedDiscountRange(discountRange);
    setAppliedUpdateTimeRange(updateTimeRange);
    setIsFilterModalOpen(false);
  };
  
  // 重置筛选设置
  const resetFilterSettings = () => {
    setSortOption(DEFAULT_FILTER_VALUES.sortOption);
    setSortDirection(DEFAULT_FILTER_VALUES.sortDirection);
    setShowOnlyInStock(DEFAULT_FILTER_VALUES.showOnlyInStock);
    setPriceRange(DEFAULT_FILTER_VALUES.priceRange);
    setDiscountRange(DEFAULT_FILTER_VALUES.discountRange);
    setUpdateTimeRange(DEFAULT_FILTER_VALUES.updateTimeRange);
  };

  // 在库存检查模态框中使用的状态样式计算

  const getStatusClass = (status: CHECK_STATUS) => {
    if (status === 'doing') {
      return 'bg-gradient-to-r from-blue-50 to-blue-100 animate-pulse border-blue-200';
    } else if (status === 'success') {
      return 'bg-gradient-to-r from-green-50 to-green-100 border-green-200';
    } else if (status === 'failed') {
      return 'bg-gradient-to-r from-red-50 to-red-100 border-red-200 opacity-60';
    } else if (status === 'disable') {
      return 'bg-gray-50 border-gray-200 opacity-60';
    }
    return '';
  };

// 计算前置检查项的状态样式
const marketStatusClass =  getStatusClass('pending')
// const marketStatusClass = getStatusClass(
//   checkMarketOption && Object.values(checkStatus).some(s => s === 'doing'),
//   checkMarketOption && Object.values(checkStatus).every(s => s === 'success'),
//   checkMarketOption && Object.values(checkStatus).some(s => s === 'failed'),
//   !checkMarketOption
// );

const transitionClass = 'transition-all duration-500 ease-in-out';
  
  function handleDebug() {
    console.log("click")
    console.log('checkingC2Cs',...checkingC2Cs)
    // console.log('skuList',...skuList?.filter(it=>it.itemsId===checkingItem?.itemsId)[0].c2cLists)
    
    // browser.devtools.network.getHAR(function (logInfo) {
    //   console.log('log',logInfo)
    // })
  };

  

  function getItemLabel(it:DB.skuItem){
    if(!it.c2cLists) return '¥ ?'
    return `¥ ${it.c2cLists?.sort((a,b)=>a!.price-b!.price)?.[0]?.showPrice}`
  }

  function isAllDisabled(item: DB.skuItem) {
    return item.c2cLists && item.c2cLists.length > 0 && 
           item.c2cLists.every(c2c => c2c?.removable === true);
  }

  function opencheckInventory(item: DB.skuItem) {
    setCheckingItem(item);
    setCheckingC2Cs(item.c2cLists||[])
    // 初始化所有c2c项为pending状态
    const initialStatus: {[key: number]: 'pending' | 'doing' | 'success' | 'failed'} = {};
    item.c2cLists?.forEach(c2c => {
      if (c2c?.c2cItemsId) {
        initialStatus[c2c.c2cItemsId] = 'pending';
      }
    });
    setCheckStatus(initialStatus);
    
    setCheckMarketOption(false);
    setSearchNewOption(true);
  }

  function closeCheckModal() {
    setCheckingItem(null);
    setCheckStatus({});
    setIsCheckingInProgress(false);
    setIsCheckingComplete(false);
  }
  
  // 处理筛选和排序
  const getFilteredAndSortedItems = () => {
    if (!skuList) return [];
    
    // 先筛选
    let filteredItems = [...skuList];
    
    // 应用筛选条件（使用已应用的筛选状态）
    filteredItems = filteredItems.filter(item => {
      // 只显示有货商品
      if (appliedShowOnlyInStock && isAllDisabled(item)) {
        return false;
      }
      
      // 价格范围筛选
      if (appliedPriceRange < 100) {
        const price = item.marketPrice / 100; // 转换为元
        if (price > appliedPriceRange) return false;
      }
      
      // 折扣范围筛选
      if (appliedDiscountRange < 100) {
        // 计算折扣率 (1 - 最低价/市场价) * 100
        const lowestPrice = item.c2cLists && item.c2cLists.length > 0 
          ? parseFloat(item.c2cLists.sort((x, y) => (x?.price || 0) - (y?.price || 0))[0]?.showPrice || '0')
          : 0;
        const marketPrice = item.marketPrice / 100;
        const discount = marketPrice > 0 ? (1 - lowestPrice / marketPrice) * 100 : 0;
        
        if (discount > appliedDiscountRange) return false;
      }
      
      // 库存更新时间筛选
      if (appliedUpdateTimeRange < 7 && item.c2cInfosLastUpdateTime) {
        const updateTime = new Date(item.c2cInfosLastUpdateTime).getTime();
        const now = new Date().getTime();
        const daysDiff = Math.floor((now - updateTime) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > appliedUpdateTimeRange) return false;
      }
      
      return true;
    });
    
    // 再排序（使用已应用的排序状态）
    filteredItems.sort((a, b) => {
      let valueA, valueB;
      
      switch (appliedSortOption) {
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
      return appliedSortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });
    
    // 如果有搜索查询且是本地搜索，应用搜索过滤
    if (searchQuery && searchType === 'local') {
      const query = searchQuery.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.skuId.toString().includes(query)
      );
    }
    
    return filteredItems;
  };

  async function startCheck() {
    if (!checkingItem) return console.error('检查项不存在');
    
    // 设置检查状态为进行中，重置完成状态
    setIsCheckingInProgress(true);
    setIsCheckingComplete(false);

    let tC2CsMap = new Map<number,C2CCheckView>();
    checkingC2Cs.forEach(x=> x && tC2CsMap.set(x.c2cItemsId,x))
    if(searchNewOption){
      try {
        console.log('start search...')
        setCheckStatus(prev => ({...prev,['checkbox-search-new']:'doing'}))
        const pendingRequest= waitForRequest(MARKET_SWG.JSON_PREFIX,'checkbox-search-new');
        await ToC2cSearch(checkingItem.skuId);
        const data = await pendingRequest;
        data.forEach(x => {
          if(!x.isSold && !tC2CsMap.get(x.c2cItemsId)){
            tC2CsMap.set(x.c2cItemsId,{
              c2cItemsId: x.c2cItemsId,
              uface: 'https://i0.hdslb.com/bfs/face/member/noface.jpg',
              uname: x.userName,
              showPrice: `${x.price}`,
            })
          }
        });
        
        setCheckStatus(prev => ({...prev,['checkbox-search-new']:'success'}))
        setCheckingC2Cs(Array.from(tC2CsMap.values()))
        console.log('search done',data);
      } catch (e) {
        console.error(e)
        setCheckStatus(prev => ({...prev,['checkbox-search-new']:'failed'}))
      }
    }

    for (const c2c of tC2CsMap.values()) {
     
      if(!c2c || !c2c?.c2cItemsId) continue;

      if (c2c?.removable) {
        setCheckStatus(prev => ({...prev,[c2c.c2cItemsId]:'disable'}))
        continue;
      }
      
      try {
        console.warn('start check',c2c.c2cItemsId,new Date())
        setCheckStatus(prev => ({...prev,[c2c.c2cItemsId]:'doing'}))
        const pendingRequest = waitForRequest(C2C_DETAIL.JSON_PREFIX,c2c.c2cItemsId);
        await JumpTo(C2C_DETAIL.URL(c2c.c2cItemsId))
        // await new Promise((r,j)=>setTimeout(r,1))
        const data = await pendingRequest;
        const c2cD = {
          ...data,
          skuItemIds: data.detailDtoList.map(it => it.itemsId),
          removable:data.publishStatus !=1 || data.saleStatus != 1,
        }
        tC2CsMap.set(c2cD.c2cItemsId,c2cD)
        // c2cArr[i] = c2cD;
        setCheckingC2Cs(Array.from(tC2CsMap.values()))
        setCheckStatus(prev => ({...prev,[c2c.c2cItemsId]:c2cD.removable?'disable':'success'}))
        
        console.warn('done check',c2c.c2cItemsId,new Date())
        
        // DB.putC2CDetail(data);
      } catch (e) {
        console.error(e);
        setCheckStatus(prev => ({...prev,[c2c.c2cItemsId]:'failed'}))
      }

    }

    setIsCheckingInProgress(false);
    setIsCheckingComplete(true);
  }

  // useEffect(()=>{
  //   if(!checkingItem) return;
  //   const newCheckingItem = skuList?.find(it=>it.itemsId===checkingItem?.itemsId)
  //   if(newCheckingItem){
  //     setCheckingItem(newCheckingItem)
  //     const tC2CsMap = new Map();
  //     checkingC2Cs.forEach(x=> x && tC2CsMap.set(x.c2cItemsId,x))
  //     newCheckingItem.c2cLists?.forEach(x=> x && tC2CsMap.set(x.c2cItemsId,x))
  //     setCheckingC2Cs(Array.from(tC2CsMap.values()))
  //   }
  // },[skuList])

  useEffect(() => {
    async function networkListener(req:globalThis.Browser.devtools.network.Request) {
      if(!req._connectionId || req._connectionId == connID && req.time == connTime) return //console.debug('reqRet',req._connectionId,req.request.url,req);
      connID = String(req._connectionId) || ""
      // console.debug('req',req._connectionId,req.request.url,req)

      if(useSettingsStore.getState().autoCaptureMall && req.request.url == C2C_LIST.URL){
        req.getContent((body, encoding)=>{
          const [data,nextId] = C2C_LIST.parse(JSON.parse(body));
          if(nextId == c2cNextId) return;
          c2cNextId = nextId;
          console.log(req._connectionId,'C2C_LIST',nextId,data)

          DB.putC2CList(data);
        })
      }else if(C2C_DETAIL.isDetail(req.request.url)){
        // console.debug('req',req._connectionId,req.request.url,req)
        req.getContent((body, encoding)=>{
          try{
            const data = (JSON.parse(body)).data as C2C_DETAIL.c2cItem
            console.log(req._connectionId,'C2C_DETAIL', data)
            checkingPromises[C2C_DETAIL.JSON_PREFIX][data.c2cItemsId]?.resolve(data)
            DB.putC2CDetail(data);
          }catch(e){
            console.error(e)
            console.error('req',req._connectionId,req.request.url,req)
          }
        })
      }else if (req.request.url.startsWith(MARKET_SWG.JSON_PREFIX)) {
        // console.warn('checkingPromises',checkingPromises[MARKET_SWG.JSON_PREFIX])
        req.getContent((body, encoding) => {
          try {
            const data = (JSON.parse(body)).data as MARKET_SWG.c2cItem[]
            console.log(req._connectionId, 'MARKET_SWG', data)
            checkingPromises[MARKET_SWG.JSON_PREFIX]['checkbox-search-new']?.resolve(data)
          } catch (e) {
            console.error(e)
            console.error('req',req._connectionId,req.request.url,req)
          }
        })
      }

    }

    browser.devtools.network.onRequestFinished.addListener(networkListener);
    return () => {
      browser.devtools.network.onRequestFinished.removeListener(networkListener);
    };
  }, [])

  return (
    <>
      {/* 选择模式下的顶部操作栏 */}
      {isSelectMode && (
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
              onClick={handleDeleteSelected}
              disabled={!hasSelectedItems}
            >
              <Trash className="h-3.5 w-3.5" />
              删除选中商品
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-md text-xs flex items-center gap-1 border-gray-200 bg-white/80"
              onClick={handleDeleteSelectedC2C}
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
      )}
      
      {/* 主内容区域 */}
      <div className={`${isSelectMode ? 'pt-12' : ''} grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 p-2 pb-16`}>
        {getFilteredAndSortedItems().map((item) => {
          const allDisabled = isAllDisabled(item);
          const isSelected = selectedItems[item.itemsId];
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
                  onClick={(e) => toggleSelectItem(item.itemsId, e)}
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
                onClick={(e) => isSelectMode ? toggleSelectItem(item.itemsId, e) : opencheckInventory(item)} //new MouseEvent('click')
                title={isSelectMode ? "点击选择" : "点击检查库存"}
                src={`https:${item.img}`} 
                alt={item.name} 
                className="w-full h-full object-contain mix-blend-multiply cursor-pointer" 
              />
              
              {/* 计数堆叠在图片上 */}
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div 
                    onClick={(e) => isSelectMode ? e.stopPropagation() : ToC2cSearch(item.skuId)}
                    className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded-full text-xs backdrop-blur-sm cursor-pointer hover:bg-[#786DF6]/90 transition-colors flex items-center gap-1 shadow-sm"
                    title="跳转s-wg搜索库存"
                  >
                    {/* item.c2cLists?.filter(x=>!x?.removable).length || */}
                    <span>x{ item.c2cItemsIds.length}</span> 
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80 p-3 rounded-lg shadow-lg border border-gray-200">
                  <h4 className="text-sm font-medium mb-2 text-gray-700">可用库存列表</h4>
                  <ul className="text-sm space-y-1 max-h-60 overflow-y-auto">
                    {item.c2cLists && item.c2cLists
                    .filter(x=>!x?.removable)
                    // .sort((a, b) => {
                    //   // 将不可用的项排在后面
                    //   const aDisabled = a?.removable;
                    //   const bDisabled = b?.removable;
                    //   if (aDisabled && !bDisabled) return 1;
                    //   if (!aDisabled && bDisabled) return -1;
                    //   return 0;
                    // })
                    .map((c2c) => {
                      const isC2CSelected = c2c?.c2cItemsId && selectedC2CItems[c2c.c2cItemsId];
                      return (
                      <li key={c2c?.c2cItemsId} 
                        onClick={(e) => isSelectMode && c2c?.c2cItemsId ? toggleSelectC2C(c2c.c2cItemsId, e) : c2c?.c2cItemsId && JumpTo(C2C_DETAIL.URL(c2c?.c2cItemsId))}
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
                                <AvatarImage src={c2c.uface} alt={c2c.uname || '用户'} />
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
                    <button 
                      onClick={() => JumpTo(C2C_DETAIL.URL(item.c2cItemsIds[0]))}
                      className={`text-white px-2 py-0.5 rounded-sm text-xs font-medium shadow-sm hover:bg-red-600 transition-colors cursor-pointer flex items-center gap-1 flex-shrink-0 ${allDisabled ? 'bg-gray-400' : 'bg-[#786DF6]'}`}
                    >
                      <span>{getItemLabel(item)}</span>
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto p-2 rounded-lg shadow-md">
                    <span className="text-xs">点击跳转市集:{item.c2cItemsIds[0]}</span>
                  </HoverCardContent>
                </HoverCard>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <span className="text-xs font-medium truncate cursor-help max-w-[calc(100%-70px)]">
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
        )})}      
      </div>

      {/* 底部悬浮工具条 */}
      <div className="fixed bottom-6 left-0 right-0 z-100 flex justify-center">
        <div className="bg-white/77 backdrop-blur-md shadow-lg rounded-full px-3 py-2 border flex items-center">
          {/* 导航组 */}
          <div className="flex items-center">
            <ToolButton 
              icon={<ArrowLeft className="h-5 w-5" />}
              label="返回"
              onClick={HistoryBack}
              variant="danger"
            />
            <ToolButton 
              icon={<Tag className="h-5 w-5" />}
              label="市集"
              onClick={() => JumpTo(C2C_LIST.HTML_URL)}
              variant="primary"
            />
            
          </div>
          
          {/* 分隔线 */}
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          
          {/* 操作工具组 */}
          <div className="flex items-center">
            <ToolButton 
              icon={<Search className="h-5 w-5" />}
              label="搜索"
              onClick={openSearch}
              active={isSearchModalOpen}
            />
            <ToolButton 
              icon={<Check className="h-5 w-5" />}
              label="选择"
              onClick={toggleSelectMode}
              active={isSelectMode}
            />
            <ToolButton 
              icon={<Layers className="h-5 w-5" />}
              label="筛选"
              onClick={openFilter}
              active={isFilterModalOpen}
            />
          </div>
          
          {/* 分隔线 */}
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          
          {/* 设置组 */}
          <div className="flex items-center">
            <ToolButton 
              icon={<Settings className="h-5 w-5" />}
              label="设置"
              onClick={openSettings}
              active={isSettingsModalOpen}
            />
            <ToolButton 
              icon={<Bug className="h-5 w-5" />}
              label="调试"
              onClick={handleDebug}
            />
          </div>
        </div>
      </div>

      {/* 搜索模态框 - 现代化设计 */}
      {isSearchModalOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50"
          onClick={() => setIsSearchModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg mx-4 animate-in fade-in slide-in-from-top-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
              {/* 搜索类型选择器 */}
              <div className="flex items-center p-2 border-b border-gray-100/50">
                <div className="flex bg-gray-100/80 rounded-xl p-1 gap-1">
                  <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      searchType === 'local' 
                        ? 'bg-white text-[#786DF6] shadow-sm border border-[#786DF6]/20' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                    }`}
                    onClick={() => setSearchType('local')}
                  >
                    <Home className="h-4 w-4" />
                    <span>本地搜索</span>
                  </button>
                  <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      searchType === 'remote' 
                        ? 'bg-white text-[#786DF6] shadow-sm border border-[#786DF6]/20' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                    }`}
                    onClick={() => setSearchType('remote')}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>远程搜索</span>
                  </button>
                </div>
              </div>
              
              {/* 搜索输入区域 */}
              <div className="relative p-4">
                <div className="relative flex items-center">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                    <Search className="h-5 w-5" />
                  </div>
                  
                  <input
                     type="text"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder={searchType === 'local' ? "搜索本地商品名称或SKU..." : "搜索远程商品..."}
                     className="w-full pl-12 pr-16 py-4 text-base bg-gray-50/80 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#786DF6]/30 focus:border-[#786DF6]/50 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
                     autoFocus
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         performSearch();
                       } else if (e.key === 'Escape') {
                         setIsSearchModalOpen(false);
                       }
                     }}
                   />
                  
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <button 
                      className="h-10 w-10 flex items-center justify-center bg-[#786DF6] rounded-lg text-white hover:bg-[#6258D4] transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                      onClick={performSearch}
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* 搜索提示 */}
                <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Enter</kbd>
                    <span>搜索</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Esc</kbd>
                    <span>关闭</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 设置模态框 */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-gray-800">设置</h3>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
               onClick={settingsOptions.toggleAutoCaptureMall}>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 flex items-center justify-center flex-shrink-0">
                    <Checkbox 
                      checked={settingsOptions.autoCaptureMall}
                      // onCheckedChange={(checked) => settingsOptions.current.autoCaptureMall = (checked === true)}
                      className="h-5 w-5 rounded-full data-[state=checked]:bg-[#786DF6] data-[state=checked]:border-none border-gray-300"
                    />
                  </div>
                  <span className="text-sm">市集自动抓取</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50 opacity-60">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 flex items-center justify-center flex-shrink-0">
                    <Checkbox 
                      checked={settingsOptions.autoCaptureDetail}
                      disabled
                      className="h-5 w-5 rounded-full data-[state=checked]:bg-[#786DF6] data-[state=checked]:border-none border-gray-300"
                    />
                  </div>
                  <span className="text-sm">商品详情自动抓取</span>
                </div>
                <span className="text-xs text-gray-500">暂不可用</span>
              </div>
              
            </div>
          </div>
        </div>
      )}
      
      {/* 筛选模态框 */}
      {isFilterModalOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div 
            className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-medium text-gray-800 flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#786DF6]" />
                筛选与排序
              </h3>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {/* 排序部分 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    排序方式
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    className={`px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-all ${sortOption === 'price' ? 'bg-[#786DF6] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    onClick={() => {
                      if (sortOption === 'price') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortOption('price');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <span>价格</span>
                    {sortOption === 'price' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    )}
                  </button>
                  
                  <button 
                    className={`px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-all ${sortOption === 'discount' ? 'bg-[#786DF6] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    onClick={() => {
                      if (sortOption === 'discount') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortOption('discount');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <span>折扣</span>
                    {sortOption === 'discount' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    )}
                  </button>
                  
                  <button 
                    className={`px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-all ${sortOption === 'stock' ? 'bg-[#786DF6] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    onClick={() => {
                      if (sortOption === 'stock') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortOption('stock');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <span>库存</span>
                    {sortOption === 'stock' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    )}
                  </button>
                  
                  <button 
                    className={`px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-all ${sortOption === 'updateTime' ? 'bg-[#786DF6] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    onClick={() => {
                      if (sortOption === 'updateTime') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortOption('updateTime');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <span>更新时间</span>
                    {sortOption === 'updateTime' && (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* 筛选部分 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    价格范围
                  </span>
                  <span className="text-xs text-gray-500">
                    0-100
                  </span>
                </div>
                <div className="px-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={priceRange || 100}
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#786DF6]"
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>¥0</span>
                    <span>¥{priceRange || 100}</span>
                  </div>
                </div>
              </div>
              
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
                    onChange={(e) => setDiscountRange(parseInt(e.target.value))}
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
                    onChange={(e) => setUpdateTimeRange(parseInt(e.target.value))}
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
                    onClick={() => setShowOnlyInStock(!showOnlyInStock)}
                  >
                    <input 
                      type="checkbox" 
                      id="showOnlyInStock" 
                      checked={showOnlyInStock}
                      onChange={(e) => setShowOnlyInStock(e.target.checked)}
                      className="sr-only" // 隐藏原始复选框
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
                  onClick={resetFilterSettings}
                >
                  重置
                </button>
                <button 
                  className="bg-[#786DF6] hover:bg-[#6258D4] text-white px-4 py-2 text-xs rounded-lg transition-colors"
                  onClick={applyFilterSettings}
                >
                  应用筛选
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 库存检查模态框  */}
      {checkingItem && (
        // <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50">
        //   <div className="bg-white/77 backdrop-blur-xs  rounded-lg w-full max-w-md mx-4 overflow-hidden shadow-[0_0_0_2000px_rgba(0,0,0,0.5)]"></div>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium text-gray-800">库存检查 - {checkingItem.name}</h3>
              <button 
                onClick={closeCheckModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2"> 
                <div
                  key="checkbox-search-new"
                  className={`flex items-center justify-between p-2 border rounded-md ${getStatusClass(checkStatus['checkbox-search-new'])}`}
                  onClick={() => setSearchNewOption((prev)=>!prev)}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 flex items-center justify-center flex-shrink-0">
                      <Checkbox 
                        defaultChecked
                        checked={searchNewOption}
                        className="h-5 w-5 rounded-full data-[state=checked]:bg-[#786DF6] data-[state=checked]:border-none border-gray-300 "
                      />
                    </div>
                    <span className="text-xs">搜索新库存</span>
                  </div>
                </div>
                <div
                  key="checkbox-check-market"
                  className={`flex items-center justify-between p-2 border rounded-md ${marketStatusClass} ${transitionClass}`}
                  onClick={() => setCheckMarketOption((prev)=>!prev)}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 flex items-center justify-center flex-shrink-0">
                      <Checkbox 
                        checked={checkMarketOption}
                        className="h-5 w-5 rounded-full data-[state=checked]:bg-[#786DF6] data-[state=checked]:border-none border-gray-300"
                      />
                    </div>
                    <span className="text-xs">会员购原价</span>
                  </div>
                  <span className={`text-xs font-medium`}>
                    ¥{checkingItem.c2cLists?.[0]?.showMarketPrice || checkingItem.marketPrice / 100}
                  </span>
                </div>

                
                
                {checkingC2Cs && checkingC2Cs
                  .sort((a, b) => {
                    // 将不可用的项排在后面
                    const aDisabled = a?.removable;
                    const bDisabled = b?.removable;
                    if (aDisabled && !bDisabled) return 1;
                    if (!aDisabled && bDisabled) return -1;
                    return 0;
                  })
                  .map((c2c) => {
                    if (!c2c?.c2cItemsId) return null;
                    
                    const status = checkStatus[c2c.c2cItemsId];
                    const isDisabled = c2c.removable || status === 'failed';

                    
                    // 根据状态设置不同的样式
                    let statusClass = '';
                    if (status === 'doing') {
                      statusClass = 'bg-gradient-to-r from-blue-50 to-blue-100 animate-pulse border-blue-200';
                    } else if (status === 'success') {
                      statusClass = 'bg-gradient-to-r from-green-50 to-green-100 border-green-200';
                    } else if (status === 'failed') {
                      statusClass = 'bg-gradient-to-r from-red-50 to-red-100 border-red-200 opacity-60';
                    } else if (c2c.removable) {
                      statusClass = 'bg-gray-50 border-gray-200 opacity-60';
                    }
                    
                    // 添加过渡动画类
                    const transitionClass = isDisabled ? 'transition-all duration-500 ease-in-out' : '';
                    
                    return (
                      <div 
                        onClick={() => JumpTo(C2C_DETAIL.URL(c2c.c2cItemsId))}
                        key={c2c.c2cItemsId} 
                        className={`flex items-center justify-between p-2 border rounded-md ${statusClass} ${transitionClass}`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border border-gray-200 flex-shrink-0">
                            {c2c.uface ? (
                              <AvatarImage src={c2c.uface} alt={c2c.uname || '用户'} />
                            ) : (
                              <AvatarFallback className="text-[10px] bg-gray-100 text-gray-500">
                                {c2c.uname?.substring(0, 1) || '用户'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="text-xs " title={c2c.uname}>{c2c.uname}</span>
                          <span className="text-xs text-gray-500 " title={`ID: ${c2c.c2cItemsId}`}>#{c2c.c2cItemsId}</span>
                        </div>
                        <span className={`text-xs font-medium ${isDisabled ? 'text-gray-400' : 'text-[#786DF6]'}`}>
                          ¥{c2c.showPrice}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            
            <div className="p-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4"></div>
                <div className="flex justify-end gap-2">
                  <Button 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-1.5 text-xs rounded-md"
                    onClick={closeCheckModal}
                  >
                    关闭
                  </Button>
                  <Button 
                    className={`px-4 py-1.5 text-xs rounded-md bg-[#786DF6] hover:bg-[#6258D4] text-white disabled:opacity-99 disabled:cursor-not-allowed`}
                    onClick={startCheck}
                    disabled={isCheckingInProgress || isCheckingComplete}
                  >
                    {isCheckingComplete ? (
                      <span className="flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" />
                        检查完成
                      </span>
                    ) : isCheckingInProgress ? (
                      <span className="flex items-center gap-1">
                        <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        检查中...
                      </span>
                    ) : (
                      '开始检查'
                    )}
                  </Button>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;


// 创建一个工具按钮组件来减少重复代码
interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  variant?: 'primary' | 'danger' | 'default';
}

const ToolButton = ({ icon, label, onClick, active = false, variant = 'default' }: ToolButtonProps) => {
  // 根据variant设置不同的颜色
  const getIconColor = () => {
    if (active) return 'text-[#786DF6]';
    switch (variant) {
      case 'primary': return 'text-[#786DF6]';
      case 'danger': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center justify-center h-10 w-10 rounded-full ${active ? 'bg-[#786DF6]/10' : 'hover:bg-gray-100'}`}
          onClick={onClick}
        >
          <div className={getIconColor()}>
            {icon}
          </div>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="p-2 w-full text-xs text-white border-none bg-black/70 rounded-md">
        {label}
      </HoverCardContent>
    </HoverCard>
  );
};
