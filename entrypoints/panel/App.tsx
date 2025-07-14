import { useEffect, useState, useMemo } from 'react';
import './App.css';
import { C2C_DETAIL, C2C_LIST, GOOFISH, MALL_DETAIL, MARKET_SWG } from './api';
import { ArrowLeft, Search, Settings, Bug, Layers, Check, CircleCheckBig, FunnelPlus, SlidersHorizontal } from 'lucide-react';
import { DB } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { networkListener, HistoryBack, JumpTo, ToC2cSearch, waitForRequest } from './tasks';
import { useSettingsStore } from '@/components/panel/settings-store';
import { useSearchStore } from '@/components/panel/search-store';
import { useSelectStore } from '@/components/panel/select-store';
import { ToolButton } from '@/components/panel/tool-button';
import { Icon } from '@iconify/react';
import { ProductCard } from '@/components/panel/product-card';
import { SelectModeToolbar } from '@/components/panel/select-mode-toolbar';
import { SearchModal } from '@/components/panel/search-modal';
import { SettingsModal } from '@/components/panel/settings-modal';
import { FilterAndSort, FilterModal, useGlobalFilterStore } from '@/components/panel/filter-modal';
import { InventoryCheckModal } from '@/components/panel/inventory-check-modal';
import AGENT from '@/premium';


type OPT_MODE = 'idle' | 'search' | 'select' | 'settings' | 'filter';

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

  // 统一的操作模式状态管理 - 确保各个功能模块互斥
  const [mode, setMode] = useState<OPT_MODE>('idle');

  // 使用 store 管理状态
  const { openSearch, closeSearch } = useSearchStore();
  const { openSettings, closeSettings } = useSettingsStore();

  // 筛选相关状态
  const filterState = useGlobalFilterStore();
  
  // 使用select store
  const { 
    isSelectMode, 
    selectedItems, 
    selectAll,
    toggleSelectMode,
  } = useSelectStore();

  
  // 同步mode状态和各个store的状态
  useEffect(() => {
    const searchState = useSearchStore.getState();
    const settingsState = useSettingsStore.getState();
    
    if (searchState.isOpen && mode !== 'search') {
      setMode('search');
    } else if (settingsState.isOpen && mode !== 'settings') {
      setMode('settings');
    } else if (filterState.isOpen && mode !== 'filter') {
      setMode('filter');
    } else if (isSelectMode && mode !== 'select') {
      setMode('select');
    } else if (!searchState.isOpen && !settingsState.isOpen && !filterState.isOpen && !isSelectMode && mode !== 'idle') {
      setMode('idle');
    }
  }, [useSearchStore().isOpen, useSettingsStore().isOpen, filterState.isOpen, isSelectMode, mode])
  
  // 统一的模式切换函数 - 核心状态管理逻辑
  function setAppMode(newMode: OPT_MODE) {
    // 如果是相同模式，则切换到idle
    if (mode === newMode) {
      newMode = 'idle';
    }
    
    // 关闭所有模态窗和状态，确保互斥性
    closeSearch();
    closeSettings();
    filterState._closeFilter();
    
    // 关闭选择模式
    if (isSelectMode && newMode !== 'select') {
      toggleSelectMode();
    }
    
    // 设置新模式
    setMode(newMode);
    
    // 根据新模式打开对应的功能
    switch (newMode) {
      case 'search':
        openSearch();
        break;
      case 'settings':
        openSettings();
        break;
      case 'select':
        if (!isSelectMode) {
          toggleSelectMode();
        }
        // 检查完成后，更新状态
        setIsCheckingInProgress(false);
        setIsCheckingComplete(true);
        break;
      case 'filter':
        useGlobalFilterStore.setState({isOpen:true});
        break;
      case 'idle':
      default:
        // 保持idle状态，所有模态窗都已关闭
        break;
    }
  }
  
  // === 模式切换处理函数 ===
  function handleOpenSettings() {
    setAppMode('settings');
  }
  
  function handleOpenSearch() {
    setAppMode('search');
  }
  
  function handleToggleSelectMode() {
    setAppMode('select');
  }
  
  function toggleFilter() {
    setAppMode('filter');
  }

  // === 其他业务逻辑函数 ===
  function handleDataChange() {
    // 数据变化后的处理逻辑
    // 由于使用了useLiveQuery，数据会自动更新
    // 这里可以添加额外的处理逻辑，比如重置筛选状态
    // filterState._reset();
  }
  
  function handleDebug() {
    console.log("click")
    AGENT.OPT.ScrollToEnd_bilimall();
    // console.log('checkingC2Cs',...checkingC2Cs)
    // console.log('skuPriceRange',filterState.skuPriceRange)
    //  console.log('sorted',skuList?.sort((a,b)=>b.marketPrice-a.marketPrice).slice(0,5))
    // console.log('skuList',...skuList?.filter(it=>it.itemsId===checkingItem?.itemsId)[0].c2cLists)
    
    // browser.devtools.network.getHAR(function (logInfo) {
    //   console.log('log',logInfo)
    // })
  };


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
  
  const skuShowList =  useMemo(()=>skuList?FilterAndSort(skuList):[],[skuList,filterState.applied])

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
    browser.devtools.network.onRequestFinished.addListener(networkListener);
    return () => {
      browser.devtools.network.onRequestFinished.removeListener(networkListener);
    };
  }, [])

  return (
    <>
      {/* 选择模式下的顶部操作栏 */}
      {isSelectMode && <SelectModeToolbar handleSelectAll={()=>selectAll(skuShowList)} />}
      
      {/* 主内容区域 */}
      {true && <div className={`${mode === 'select' || mode === 'search' ? 'pt-16' : 'pt-2'} grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 p-2 pb-16`}>
        {skuShowList.map((item) => {
          const isSelected = selectedItems[item.itemsId];
          return (
            <ProductCard
              key={item.itemsId}
              item={item}
              onOpenInventoryCheck={opencheckInventory}
            />
          );
        })}      
      </div>}

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
              icon={<Search/>}
              label="搜索"
              onClick={handleOpenSearch}
              active={mode === 'search'}
            />
            <ToolButton 
              icon={<CircleCheckBig />}
              label="选择"
              onClick={handleToggleSelectMode}
              active={mode === 'select'}
            />
            <ToolButton 
              icon={<SlidersHorizontal />}
              label="筛选"
              onClick={toggleFilter}
              active={mode === 'filter'}
            />
            {AGENT.ok && <AGENT.COMP.AgentButton />}
            
          </div>
          
          {/* 分隔线 */}
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          
          {/* 设置组 */}
          <div className="flex items-center">
            <ToolButton 
              icon={<Settings className="h-5 w-5" />}
              label="设置"
              onClick={handleOpenSettings}
              active={mode === 'settings'}
            />
            <ToolButton 
              icon={<Bug className="h-5 w-5" />}
              label="调试"
              onClick={handleDebug}
            />
          </div>
        </div>
      </div>

      <AGENT.COMP.SkuAgentBoard/>

      <SearchModal />
      
      <SettingsModal
        onDataChange={handleDataChange}
      />
      
      <FilterModal/>
      
      <InventoryCheckModal
        checkingItem={checkingItem}
        checkingC2Cs={checkingC2Cs}
        checkStatus={checkStatus}
        searchNewOption={searchNewOption}
        checkMarketOption={checkMarketOption}
        isCheckingInProgress={isCheckingInProgress}
        isCheckingComplete={isCheckingComplete}
        onSearchNewOptionChange={setSearchNewOption}
        onCheckMarketOptionChange={setCheckMarketOption}
        onStartCheck={startCheck}
        onClose={closeCheckModal}
      />
    </>
  );
}

export default App;
