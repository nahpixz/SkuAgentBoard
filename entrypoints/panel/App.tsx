import { useEffect, useState } from 'react';
import './App.css';
import { MALL_LIST } from './api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {c2cData.map((item) => (
          <Card key={item.c2cItemsId}>
            <CardHeader>
              <img src={`https:${item.detailDtoList[0].img}`} alt={item.detailDtoList[0].name} className="w-full h-48 object-cover" />
              <CardTitle>{item.detailDtoList[0].name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-red-500 font-bold text-lg">{item.showPrice}</span>
                  <span className="text-gray-500 line-through ml-2">{item.showMarketPrice}</span>
                </div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <span className="text-sm text-gray-600 cursor-pointer">
                      x{item.totalItemsCount}
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <ul>
                      {item.detailDtoList.map((sku) => (
                        <li key={sku.skuId} className="flex justify-between">
                          <span>{sku.name}</span>
                          <span>¥{sku.marketPrice}</span>
                        </li>
                      ))}
                    </ul>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="link" onClick={() => alert(`c2cItemsId: ${item.c2cItemsId}`)}>
                Show c2cItemsId
              </Button>
              <Button variant="link" onClick={() => alert(`skuId: ${item.detailDtoList[0].skuId}`)}>
                Show skuId
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}

export default App;
