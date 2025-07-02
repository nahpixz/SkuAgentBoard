import { useEffect, useState } from 'react';
import './App.css';
import { C2C_DETAIL, C2C_LIST, MALL_DETAIL, MARKET_SWG } from './api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Info, Tag } from 'lucide-react';
import { DB } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
function App() {
  const [c2cNextId,setC2cNextId] = useState<string>("")
  // const [c2cData,setC2cData] = useState<C2C_LIST.c2cItem[]>([])
  const skuList = useLiveQuery(() => DB.getSkuList());

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
  useEffect(() => {
    browser.devtools.network.onRequestFinished.addListener(function (req) {
      if(req.request.url == C2C_LIST.URL){
        console.log('req', req)

        req.getContent((body, encoding)=>{
          const [data,nextId] = C2C_LIST.parse(JSON.parse(body));
          if(nextId == c2cNextId) return;
          console.log(c2cNextId,data)
          setC2cNextId(c2cNextId||"")
          DB.putC2CList(data);
        })
      }

      if(req.request.url.startsWith(MARKET_SWG.URL_searchItemHistory)){
        req.getContent((body, encoding)=>{
          console.log('reqSearch', req)
        })
      }
      

      })
  }, [])

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 p-2 bg-white/80 backdrop-blur-md shadow-sm flex items-center gap-2 border-b">
        <Button 
          className="bg-[#786DF6] hover:bg-[#6258D4] text-white rounded-full px-4 py-2 text-sm font-medium transition-all" 
          onClick={()=>JumpTo(C2C_LIST.HTML_URL)}
        >
          市集
        </Button> 
        <Button 
          className="bg-[#786DF6] hover:bg-[#6258D4] text-white rounded-full px-4 py-2 text-sm font-medium transition-all" 
          onClick={()=>JumpTo(MARKET_SWG.HTML_URL)}
        >
          搜索
        </Button> 
        <Button 
          className="bg-red-500 hover:bg-red-600 text-white rounded-full px-4 py-2 text-sm font-medium transition-all" 
          onClick={HistoryBack}
        >
          返回上一页
        </Button>
        <Button 
          className="ml-auto bg-black/10 hover:bg-black/20 text-gray-800 rounded-full px-4 py-2 text-sm font-medium transition-all" 
          onClick={handleClick}
        >
          调试
        </Button>
      </div>
      
      <div className="pt-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-2">
        {skuList&&skuList.map((item) => (
          <Card key={item.itemsId} className="overflow-hidden py-0 gap-1">
             
            <div className="relative one bg-[#EDEDED]">
              <img 
                src={`https:${item.img}`} 
                alt={item.name} 
                className="w-full h-48 object-cover" 
              />
              
              {/* 计数堆叠在图片上 */}
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div 
                    onClick={() => JumpTo(MARKET_SWG.ITEM_URL(item.skuId))}
                    className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs backdrop-blur-sm cursor-pointer">
                    x{item.c2cItemsIds.length}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <ul className="text-sm">
                    {item.c2cLists && item.c2cLists.map((c2c) => (
                      <li key={c2c?.c2cItemsId} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                        <span>{c2c?.uname}</span>
                        <span>¥{c2c?.showPrice}</span>
                      </li>
                    ))}
                  </ul>
                </HoverCardContent>
              </HoverCard>
              
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button 
                    onClick={() => JumpTo(MALL_DETAIL.URL(item.itemsId))}
                    className="absolute top-2 right-2 bg-black/40 text-white/90 px-1.5 py-0.5 text-[10px] rounded-sm backdrop-blur-sm hover:bg-black/60 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Info className="h-2.5 w-2.5 opacity-70" />
                    <span>¥{item.marketPrice/100}</span>
                    
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-auto p-2">
                  <span className="text-xs">点击跳转会员购:{item.itemsId}</span>
                </HoverCardContent>
              </HoverCard>
            </div>
            
            <div className="p-1">
              <div className="flex items-center gap-1">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button 
                      onClick={() => JumpTo(C2C_DETAIL.URL(item.c2cItemsIds[0]))}
                      className="bg-[#786DF6] text-white px-2 py-0.5 rounded-sm text-sm font-bold shadow-sm hover:bg-red-600 transition-colors cursor-pointer flex items-center gap-1 flex-shrink-0"
                    >
                      {/* <Tag className="h-3 w-3 opacity-70" /> */}
                      <span>{getItemLabel(item)}</span>
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto p-2">
                    <span className="text-xs">点击跳转市集:{item.c2cItemsIds[0]}</span>
                  </HoverCardContent>
                </HoverCard>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <span className="text-sm font-medium truncate cursor-help max-w-[calc(100%-80px)]">
                      {item.name}
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 p-2">
                    <p className="text-sm">{item.name}</p>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
            
          </Card>
        ))}
      </div>
    </>
  );
}

export default App;
