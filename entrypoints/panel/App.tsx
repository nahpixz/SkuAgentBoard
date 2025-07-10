import { useEffect, useState, useMemo } from 'react';
import './App.css';
import { C2C_DETAIL, C2C_LIST, GOOFISH, MALL_DETAIL, MARKET_SWG } from './api';
import { ArrowLeft, Search, Settings, Bug, Layers, Check } from 'lucide-react';
import { DB } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { checkingPromises, HistoryBack, JumpTo, ToC2cSearch, waitForRequest } from './tasks';
import { useSettingsStore } from './store';
import { ToolButton } from '@/components/panel/tool-button';
import { Icon } from '@iconify/react';
import { ProductCard } from '@/components/panel/product-card';
import { SelectModeToolbar } from '@/components/panel/select-mode-toolbar';
import { SearchModal } from '@/components/panel/search-modal';
import { SettingsModal } from '@/components/panel/settings-modal';
import { FilterModal, useGlobalFilterStore } from '@/components/panel/filter-modal';
import { InventoryCheckModal } from '@/components/panel/inventory-check-modal';

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
  const filterState = useGlobalFilterStore();

  const [hasSelectedItems, setHasSelectedItems] = useState(false);
  const [hasSelectedC2C, setHasSelectedC2C] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{[key: number]: boolean}>({});
  const [selectedC2CItems, setSelectedC2CItems] = useState<{[key: number]: boolean}>({});

  useEffect(()=>{
    const prices = skuList?.map(item => item.marketPrice/100) || [0];
    const skuMin = Math.min(...prices);
    const skuMax = Math.max(...prices) || 100;
    filterState._resetSkuPriceRange(skuMin,skuMax)
  },[skuList])
  
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
    filterState._closeFilter();
    
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

  function handleDataChange() {
    // 数据变化后的处理逻辑
    // 由于使用了useLiveQuery，数据会自动更新
    // 这里可以添加额外的处理逻辑，比如重置筛选状态
    resetFilterSettings();
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
  function toggleFilter() {
    if (filterState.isOpen) {
      filterState._closeFilter();
    } else {
      closeAllModals();
      useGlobalFilterStore.setState({isOpen:true});
    }
  }
  
  // 应用筛选设置
  const applyFilterSettings = () => {
    filterState._apply();
    filterState._closeFilter();
  };
  
  // 重置筛选设置
  const resetFilterSettings = () => {
    filterState._reset();
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
    console.log('skuPriceRange',filterState.skuPriceRange)
     console.log('sorted',skuList?.sort((a,b)=>b.marketPrice-a.marketPrice).slice(0,5))
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
      if (filterState.applied?.showOnlyInStock && isAllDisabled(item)) {
        return false;
      }
      
      // 价格范围筛选
      const price = item.marketPrice / 100; // 转换为元
      if (filterState.applied && (price < filterState.applied.priceRange[0] || price > filterState.applied.priceRange[1])) {
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
    
    // 再排序（使用已应用的排序状态）
    filteredItems.sort((a, b) => {
      let valueA, valueB;
      
      switch (filterState.applied?.sortOption) {
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
      return filterState.applied.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
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
              uface: 'https://i0.hdslb.com/bfs/face/member/noface.jpg@72w_72h_85q.webp',
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
        <SelectModeToolbar
          hasSelectedItems={hasSelectedItems}
          hasSelectedC2C={hasSelectedC2C}
          onSelectAll={handleSelectAll}
          onDeleteSelected={handleDeleteSelected}
          onDeleteSelectedC2C={handleDeleteSelectedC2C}
          onToggleSelectMode={toggleSelectMode}
        />
      )}
      
      {/* 主内容区域 */}
      <div className={`${isSelectMode||isSearchModalOpen ? 'pt-16' : 'pt-2'} grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 p-2 pb-16`}>
        {getFilteredAndSortedItems().map((item) => {
          const isSelected = selectedItems[item.itemsId];
          return (
            <ProductCard
              key={item.itemsId}
              item={item}
              isSelectMode={isSelectMode}
              isSelected={isSelected}
              onToggleSelect={toggleSelectItem}
              onToggleSelectC2C={toggleSelectC2C}
              onOpenInventoryCheck={opencheckInventory}
              selectedC2CItems={selectedC2CItems}
            />
          );
        })}      
      </div>

      {/* 底部悬浮工具条 */}
      <div className="fixed bottom-6 left-0 right-0 z-51 flex justify-center">
        <div className="bg-white/77 backdrop-blur-md shadow-lg rounded-full px-3 py-2 border flex items-center">
          {/* 导航组 */}
          <div className="flex items-center">
            <ToolButton 
              icon={<ArrowLeft className="h-8 w-8" />}
              label="返回"
              onClick={HistoryBack}
              variant="danger"
            />
            <ToolButton 
              icon={<Icon icon="mingcute:bilibili-fill" className="size-5 text-[#fb7299]" />}
              label="市集"
              onClick={() => JumpTo(C2C_LIST.HTML_URL)}
            />

            <ToolButton 
              icon={<img className="size-5" src="https://gw.alicdn.com/imgextra/i2/O1CN01yQ3RYl1EqAGI2JrGE_!!6000000000402-2-tps-144-144.png_110x10000.jpg_.webp"/>}
              label="闲鱼"
              onClick={() => JumpTo(GOOFISH.SEARCH_URL)}
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
              onClick={toggleFilter}
              active={filterState.isOpen}
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

      <SearchModal
        isOpen={isSearchModalOpen}
        searchType={searchType}
        searchQuery={searchQuery}
        onSearchTypeChange={setSearchType}
        onSearchQueryChange={setSearchQuery}
        onSearch={performSearch}
        onClose={() => setIsSearchModalOpen(false)}
      />
      
      <SettingsModal
        isOpen={isSettingsModalOpen}
        autoCaptureMall={settingsOptions.autoCaptureMall}
        autoCaptureDetail={settingsOptions.autoCaptureDetail}
        onToggleAutoCaptureMall={settingsOptions.toggleAutoCaptureMall}
        onDataChange={handleDataChange}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      
      <FilterModal skuList={skuList || []} />
      
      <InventoryCheckModal
        checkingItem={checkingItem}
        checkingC2Cs={checkingC2Cs}
        checkStatus={checkStatus}
        searchNewOption={searchNewOption}
        checkMarketOption={checkMarketOption}
        isCheckingInProgress={isCheckingInProgress}
        isCheckingComplete={isCheckingComplete}
        // marketStatusClass={marketStatusClass}
        // transitionClass={transitionClass}
        onSearchNewOptionChange={setSearchNewOption}
        onCheckMarketOptionChange={setCheckMarketOption}
        onStartCheck={startCheck}
        onClose={closeCheckModal}
        // getStatusClass={getStatusClass}
      />
    </>
  );
}

export default App;
