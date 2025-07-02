import { useEffect, useState } from 'react';
import './App.css';
import { C2C_DETAIL, C2C_LIST, MALL_DETAIL, MARKET_SWG } from './api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Info, Tag, Check, AlertCircle, Clock } from 'lucide-react';
import { DB } from './db';
import { useLiveQuery } from 'dexie-react-hooks';

let connID = "";
let c2cNextId = "";

function App() {
  // const [c2cData,setC2cData] = useState<C2C_LIST.c2cItem[]>([])
  const skuList = useLiveQuery(() => DB.getSkuList());
  const [checkingItem, setCheckingItem] = useState<DB.skuItem | null>(null);
  const [checkStatus, setCheckStatus] = useState<{[key: number]: 'pending' | 'checking' | 'success' | 'failed'}>({});

  function handleClick() {
    console.log("click")
    // browser.devtools.network.getHAR(function (logInfo) {
    //   console.log('log',logInfo)
    // })
  };

  function JumpTo(url: string) {
    browser.devtools.inspectedWindow.eval(`window.location.assign("${url}");`,
      (result, error) => {
        if (error) console.error("跳转失败:", error);
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

  function startCheckInventory(item: DB.skuItem) {
    setCheckingItem(item);
    // 初始化所有c2c项为pending状态
    const initialStatus: {[key: number]: 'pending' | 'checking' | 'success' | 'failed'} = {};
    item.c2cLists?.forEach(c2c => {
      if (c2c?.c2cItemsId) {
        initialStatus[c2c.c2cItemsId] = 'pending';
      }
    });
    setCheckStatus(initialStatus);
  }

  function simulateCheck() {
    if (!checkingItem || !checkingItem.c2cLists) return;
    
    // 模拟检查过程
    const newStatus = {...checkStatus};
    let remaining = Object.keys(checkStatus).length;
    
    checkingItem.c2cLists.forEach((c2c, index) => {
      if (!c2c?.c2cItemsId) return;
      
      // 设置为checking状态
      newStatus[c2c.c2cItemsId] = 'checking';
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

  useEffect(() => {
    browser.devtools.network.onRequestFinished.addListener(function (req) {
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
      
      if(req.request.url.startsWith(MARKET_SWG.URL_searchItemHistory)){
        const sku_id = Number(req.request.queryString.find(x=>x.name=='sku_id')?.value);
        req.getContent((body, encoding)=>{
          const data = (JSON.parse(body)).data as MARKET_SWG.c2cItem[]
          console.log(req._connectionId,'MARKET_SWG', MARKET_SWG.filterLatestRecords(data))
          // if(sku_id) DB.putC2CSeachHistory(data,sku_id);
        })
      }

  
      

    })
  }, [])

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 p-2 bg-white/80 backdrop-blur-md shadow-sm flex items-center gap-2 border-b">
        <Button 
          className="bg-[#786DF6] hover:bg-[#6258D4] text-white rounded-full px-4 py-1.5 text-xs font-medium transition-all" 
          onClick={()=>JumpTo(C2C_LIST.HTML_URL)}
        >
          市集
        </Button> 
        <Button 
          className="bg-[#786DF6] hover:bg-[#6258D4] text-white rounded-full px-4 py-1.5 text-xs font-medium transition-all" 
          onClick={()=>JumpTo(MARKET_SWG.HTML_URL)}
        >
          搜索
        </Button> 
        <Button 
          className="bg-red-500 hover:bg-red-600 text-white rounded-full px-4 py-1.5 text-xs font-medium transition-all" 
          onClick={HistoryBack}
        >
          返回上一页
        </Button>
        <Button 
          className="ml-auto bg-black/10 hover:bg-black/20 text-gray-800 rounded-full px-4 py-1.5 text-xs font-medium transition-all" 
          onClick={handleClick}
        >
          调试
        </Button>
      </div>
      
      <div className="pt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 p-2">
        {skuList&&skuList.map((item) => {
          const allDisabled = isAllDisabled(item);
          return (
          <Card 
            key={item.itemsId} 
            className={`overflow-hidden py-0 gap-0 border transition-all hover:shadow-md ${allDisabled ? 'opacity-60 grayscale border-gray-200' : 'border-gray-200 hover:border-[#786DF6]/50'}`}
          >
             
            <div className="relative bg-[#F5F5F5] h-36">
              <img 
                onClick={() => startCheckInventory(item)}
                title="点击检查库存"
                src={`https:${item.img}`} 
                alt={item.name} 
                className="w-full h-full object-contain mix-blend-multiply cursor-pointer" 
              />
              
              {/* 计数堆叠在图片上 */}
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div 
                    onClick={() => JumpTo(MARKET_SWG.ITEM_URL(item.skuId))}
                    className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded-full text-xs backdrop-blur-sm cursor-pointer hover:bg-[#786DF6]/90 transition-colors flex items-center gap-1 shadow-sm"
                    title="跳转s-wg搜索库存"
                  >
                    <span>x{item.c2cItemsIds.length}</span>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80 p-3 rounded-lg shadow-lg border border-gray-200">
                  <h4 className="text-sm font-medium mb-2 text-gray-700">可用库存列表</h4>
                  <ul className="text-sm space-y-1 max-h-60 overflow-y-auto">
                    {item.c2cLists && item.c2cLists.map((c2c) => (
                      <li key={c2c?.c2cItemsId} 
                        onClick={() => c2c?.c2cItemsId && JumpTo(C2C_DETAIL.URL(c2c?.c2cItemsId))}
                        className={`flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-gray-50 ${c2c?.removable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border border-gray-200">
                            {c2c?.uface ? (
                              <AvatarImage src={c2c.uface} alt={c2c.uname || '用户'} />
                            ) : (
                              <AvatarFallback className="text-[10px] bg-gray-100 text-gray-500">
                                {c2c?.uname?.substring(0, 2) || '用户'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className={`text-xs ${c2c?.removable ? 'text-gray-400' : 'text-gray-700'}`}>
                            {c2c?.uname}
                          </span>
                        </div>
                        <span className={`text-xs font-medium ${c2c?.removable ? 'text-gray-400' : 'text-[#786DF6]'}`}>
                          ¥{c2c?.showPrice}
                        </span>
                      </li>
                    ))}
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

      {checkingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
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
                  className={`flex items-center justify-between p-2 border rounded-md`} //${statusClass}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-gray-200 flex-shrink-0">
                       <AvatarImage src="" />
                    </Avatar>
                    <span className="text-xs ">会员购原价</span>
                    
                  </div>
                  <span className={`text-xs font-medium`}>
                    ¥{checkingItem.c2cLists?.[0]?.showMarketPrice || checkingItem.marketPrice / 100}
                  </span>
                </div>
                
                {checkingItem.c2cLists && checkingItem.c2cLists
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
                    if (status === 'checking') {
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
                                {c2c.uname?.substring(0, 2) || '用户'}
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
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1" title="通过s-wg搜索库存">
                    <input 
                      type="checkbox" 
                      id="check-local" 
                      className="h-4 w-4 rounded border-gray-300 text-[#786DF6] focus:ring-[#786DF6]" 
                      defaultChecked 
                    />
                    搜索新库存
                  </div>
                  
                  {/* <div className="flex items-center gap-1" title="检查远程库存">
                    <input 
                      type="checkbox" 
                      id="check-remote" 
                      className="h-4 w-4 rounded border-gray-300 text-[#786DF6] focus:ring-[#786DF6]" 
                      defaultChecked 
                    />
                    <label htmlFor="check-remote" className="text-xs text-gray-700 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2 L2 7 L12 12 L22 7 L12 2" />
                        <path d="M2 17 L12 22 L22 17" />
                        <path d="M2 12 L12 17 L22 12" />
                      </svg>
                    </label>
                  </div> */}
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-1.5 text-xs rounded-md"
                    onClick={closeCheckModal}
                  >
                    关闭
                  </Button>
                  <Button 
                    className="bg-[#786DF6] hover:bg-[#6258D4] text-white px-4 py-1.5 text-xs rounded-md"
                    onClick={simulateCheck}
                  >
                    开始检查
                  </Button>
                </div>
              </div>
              
              {/* 进度指示器 */}
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                {Object.values(checkStatus).length > 0 && (
                  <div 
                    className="h-full bg-[#786DF6] transition-all duration-300 ease-out"
                    style={{
                      width: `${Object.values(checkStatus).filter(s => s !== 'pending').length / Object.values(checkStatus).length * 100}%`
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
