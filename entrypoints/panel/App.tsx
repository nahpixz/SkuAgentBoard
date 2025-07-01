import { useEffect, useState } from 'react';
import './App.css';
import { MALL_LIST } from './api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Info, Tag } from 'lucide-react';

function App() {
  const [c2cData,setC2cData] = useState<MALL_LIST.c2cItem[]>([])
  function handleClick() {
    console.log("click")
    // browser.devtools.network.getHAR(function (logInfo) {
    //   console.log('log',logInfo)
    // })
    // Mock data for demonstration
    const mockData: MALL_LIST.c2cItem[] = [
      {
        c2cItemsId: 12345,
        c2cItemsName: '示例商品',
        detailDtoList: [
          {
            blindBoxId: 1,
            img: 'https://via.placeholder.com/150',
            isHidden: false,
            itemsId: 54321,
            marketPrice: 200,
            name: 'SKU 1',
            skuId: 9876,
            type: 1,
          },
          {
            blindBoxId: 2,
            img: 'https://via.placeholder.com/150',
            isHidden: false,
            itemsId: 54322,
            marketPrice: 300,
            name: 'SKU 2',
            skuId: 9877,
            type: 0,
          },
        ],
        isMyPublish: false,
        paymentTime: 1672502400,
        price: 150,
        showMarketPrice: '¥200.00',
        showPrice: '¥150.00',
        totalItemsCount: 1,
        type: 1,
        uface: '',
        uid: '123',
        uname: '测试用户',
        uspaceJumpUrl: null,
      },
    ];
    setC2cData(mockData);
  };
  useEffect(() => {
    browser.devtools.network.onRequestFinished.addListener(function (req) {
      if(req.request.url == MALL_LIST.URL){
        console.log('req', req)
        req.getContent((body, encoding)=>{
          const data = MALL_LIST.parse(JSON.parse(body));
          setC2cData(data);
          console.log('data', data)
        })
      }

      })
  }, [])

  return (
    <>
      <Button onClick={handleClick}>Debug</Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-2">
        {c2cData.map((item) => (
          <Card key={item.c2cItemsId} className="overflow-hidden py-0 gap-1">
             
            <div className="relative one bg-[#EDEDED]">
              <img 
                src={`https:${item.detailDtoList[0].img}`} 
                alt={item.detailDtoList[0].name} 
                className="w-full h-48 object-cover" 
              />
              
              {/* 计数堆叠在图片上 */}
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs backdrop-blur-sm cursor-pointer">
                    x{item.totalItemsCount}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <ul className="text-sm">
                    {item.detailDtoList.map((sku) => (
                      <li key={sku.skuId} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                        <span>{sku.name}</span>
                        <span>¥{sku.marketPrice}</span>
                      </li>
                    ))}
                  </ul>
                </HoverCardContent>
              </HoverCard>
              
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button 
                    onClick={() => alert(`skuId: ${item.detailDtoList[0].skuId}`)}
                    className="absolute top-2 right-2 bg-black/40 text-white/90 px-1.5 py-0.5 text-[10px] line-through rounded-sm backdrop-blur-sm hover:bg-black/60 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Info className="h-2.5 w-2.5 opacity-70" />
                    <span>¥{item.showMarketPrice}</span>
                    
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-auto p-2">
                  <span className="text-xs">点击显示skuId: {item.detailDtoList[0].skuId}</span>
                </HoverCardContent>
              </HoverCard>
            </div>
            
            <div className="p-1">
              <div className="flex items-center gap-1">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button 
                      onClick={() => alert(`c2cItemsId: ${item.c2cItemsId}`)}
                      className="bg-[#786DF6] text-white px-2 py-0.5 rounded-sm text-sm font-bold shadow-sm hover:bg-red-600 transition-colors cursor-pointer flex items-center gap-1 flex-shrink-0"
                    >
                      {/* <Tag className="h-3 w-3 opacity-70" /> */}
                      <span>¥{item.showPrice}</span>
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-auto p-2">
                    <span className="text-xs">点击显示c2cItemsId: {item.c2cItemsId}</span>
                  </HoverCardContent>
                </HoverCard>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <span className="text-sm font-medium truncate cursor-help max-w-[calc(100%-80px)]">
                      {item.detailDtoList[0].name}
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 p-2">
                    <p className="text-sm">{item.detailDtoList[0].name}</p>
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
