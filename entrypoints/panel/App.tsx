import { useState } from 'react';
import './App.css';
import { MALL_LIST } from './api';
import { Button } from "@/components/ui/button";

function App() {
  const [c2cData,setC2cData] = useState<MALL_LIST.c2cItem[]>([])
  function handleClick() {
    console.log("click")
    browser.devtools.network.getHAR(function (logInfo) {
      console.log('log',logInfo)
    })
  }

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

       

    </>
  );
}

export default App;
