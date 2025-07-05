import { useEffect, useState } from 'react';
import './App.css';
import { C2C_DETAIL, C2C_LIST, MALL_DETAIL, MARKET_SWG } from './api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Info, Tag, Check, AlertCircle, Clock, ArrowLeft, Search, Settings, Trash, X, Bug, Home, ShoppingCart, Layers } from 'lucide-react';
import { DB } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { waitSearchNew } from './tasks';

let connID = "";
let c2cNextId = "";

let searchNewPromise:{resolve:(v:any) => void,reject:() => void}|null = null;
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

  const [checkMarketOption, setCheckMarketOption] = useState(true);
  const [searchNewOption, setSearchNewOption] = useState(true);

  const [hasSelectedItems, setHasSelectedItems] = useState(false);
  const [hasSelectedC2C, setHasSelectedC2C] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{[key: number]: boolean}>({});
  const [selectedC2CItems, setSelectedC2CItems] = useState<{[key: number]: boolean}>({});
  
  // 切换选择模式
  function toggleSelectMode() {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      // 退出选择模式时清空选择
      setSelectedItems({});
      setSelectedC2CItems({});
      setHasSelectedItems(false);
      setHasSelectedC2C(false);
    }
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
  
  // 打开设置
  function openSettings() {
    // 实现打开设置的逻辑
  }

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
  
  function handleClick() {
    console.log("click")
    // browser.devtools.network.getHAR(function (logInfo) {
    //   console.log('log',logInfo)
    // })
  };

  function JumpTo(url: string) {
    return new Promise<void>((resolve,reject)=>{
      browser.devtools.inspectedWindow.eval(`window.location.assign("${url}");`,
      (result, e) => {
        if (e) {
          console.error("跳转失败:", e);
          reject(e)
        }
        resolve()
      })
    })
    
  }
  function HistoryBack() {
    browser.devtools.inspectedWindow.eval(`history.back()`,
      (result, error) => {
        if (error) console.error("跳转失败:", error);
      })
  }

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
    
    setCheckMarketOption(true);
    setSearchNewOption(true);
  }

  function simulateCheck() {
    if (!checkingItem || !checkingItem.c2cLists) return;
    
    // 模拟检查过程
    const newStatus = {...checkStatus};
    let remaining = Object.keys(checkStatus).length;
    
    checkingItem.c2cLists.forEach((c2c, index) => {
      if (!c2c?.c2cItemsId) return;
      
      // 设置为checking状态
      newStatus[c2c.c2cItemsId] = 'doing';
      setCheckStatus({...newStatus});
      
      // 模拟异步检查结果
      setTimeout(() => {
        // 随机结果，实际应用中应替换为真实API调用
        newStatus[c2c.c2cItemsId] = Math.random() > 0.5 ? 'success' : 'failed';
        setCheckStatus({...newStatus});
        
        remaining--;
        if (remaining === 0) {
          // 所有检查完成后的操作
          console.log('所有检查完成');
        }
      }, 1000 + index * 500); // 错开时间以模拟真实场景
    });
  }

  function closeCheckModal() {
    setCheckingItem(null);
    setCheckStatus({});
  }

  async function startCheck() {
    if (!checkingItem) return console.error('检查项不存在');
    if(searchNewOption){
      console.log('start search...')
      setCheckStatus({...checkStatus,['checkbox-search-new']:'doing'})
      JumpTo(MARKET_SWG.ITEM_URL(checkingItem.skuId));
      const data = await waitSearchNew();
      console.log('search done',data);
      setCheckingC2Cs(prev => [
        ...prev,
        ...data.filter(x => !x.isSold)
          .map(x => ({
            c2cItemsId: x.c2cItemsId,
            uface: 'https://i0.hdslb.com/bfs/face/member/noface.jpg',
            uname: x.userName,
            showPrice: `${x.price}`,
          }))
        ]
      )
      setCheckStatus({...checkStatus,['checkbox-search-new']:'success'})
    }

  }

  useEffect(() => {
    browser.devtools.network.onRequestFinished.addListener(async function (req) {
      if(req._connectionId == connID) return;
      connID = String(req._connectionId) || ""
      // console.debug('req',connID, req)

      if(req.request.url == C2C_LIST.URL){
        req.getContent((body, encoding)=>{
          const [data,nextId] = C2C_LIST.parse(JSON.parse(body));
          if(nextId == c2cNextId) return;
          c2cNextId = nextId;
          console.log(req._connectionId,'C2C_LIST',nextId,data)

          DB.putC2CList(data);
        })
      }

      if(C2C_DETAIL.isDetail(req.request.url)){
        req.getContent((body, encoding)=>{
          const data = (JSON.parse(body)).data as C2C_DETAIL.c2cItem
          console.log(req._connectionId,'C2C_DETAIL', data)
          
          DB.putC2CDetail(data);
        })
      }
    })
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
        {skuList&&skuList.map((item) => {
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
                    onClick={(e) => isSelectMode ? e.stopPropagation() : JumpTo(MARKET_SWG.ITEM_URL(item.skuId))}
                    className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded-full text-xs backdrop-blur-sm cursor-pointer hover:bg-[#786DF6]/90 transition-colors flex items-center gap-1 shadow-sm"
                    title="跳转s-wg搜索库存"
                  >
                    <span>x{item.c2cItemsIds.length}</span>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80 p-3 rounded-lg shadow-lg border border-gray-200">
                  <h4 className="text-sm font-medium mb-2 text-gray-700">可用库存列表</h4>
                  <ul className="text-sm space-y-1 max-h-60 overflow-y-auto">
                    {item.c2cLists && item.c2cLists.map((c2c) => {
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
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center">
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
            <ToolButton 
              icon={<Search className="h-5 w-5" />}
              label="搜索"
              onClick={() => JumpTo(MARKET_SWG.HTML_URL)}
              variant="primary"
            />
            
          </div>
          
          {/* 分隔线 */}
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          
          {/* 操作工具组 */}
          <div className="flex items-center">
            <ToolButton 
              icon={<Check className="h-5 w-5" />}
              label="选择"
              onClick={toggleSelectMode}
              active={isSelectMode}
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
            />
            <ToolButton 
              icon={<Bug className="h-5 w-5" />}
              label="调试"
              onClick={handleClick}
            />
          </div>
        </div>
      </div>

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
                        defaultChecked
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
                    const aDisabled = a?.removable || checkStatus[a?.c2cItemsId || 0] === 'failed';
                    const bDisabled = b?.removable || checkStatus[b?.c2cItemsId || 0] === 'failed';
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
                <div className="flex justify-end gap-2">
                  <Button 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-1.5 text-xs rounded-md"
                    onClick={closeCheckModal}
                  >
                    关闭
                  </Button>
                  <Button 
                    className="bg-[#786DF6] hover:bg-[#6258D4] text-white px-4 py-1.5 text-xs rounded-md"
                    onClick={startCheck}
                  >
                    开始检查
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
