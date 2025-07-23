import { useSettingsStore } from "@/components/panel/settings-store";
import { C2C_LIST, MALL_DETAIL, ORDER_DETAIL } from "@/entrypoints/panel/api";
import { getInspectedUrl, JumpToComplete, waitForRequest } from "@/entrypoints/panel/tasks";
import { skuAgentStore } from "./components/skuFetchAgent";
import { ScrollToEnd_bilimall, evalInConsole, captureVisibleTab, waitForFrame, evalGetBoundingClientRect, captureWithRect } from "./opts";
import { ListenKey } from "@/entrypoints/panel/networkListener";
import { number } from "motion/react";

export async function skuAutoScroll(){
  const autoCaptureMall = useSettingsStore.getState().getAndOpen_AutoCaptureMall() //缓存旧autoCaptureMall
  const url = await getInspectedUrl();
  
  console.log('url',url)
  
  if(!url?.startsWith(C2C_LIST.HTML_URL)){
    ListenKey.C2C_LIST = "skuAgentLoadPage";
    const pending = waitForRequest(C2C_LIST.URL,ListenKey.C2C_LIST);
    await JumpToComplete(C2C_LIST.HTML_URL);
    const data = await pending;
    skuAgentStore.getState().stepCount(data.length);
  }

  while (skuAgentStore.getState().running) {
    ListenKey.C2C_LIST = "skuAgentAutoScroll";
    const pending = waitForRequest(C2C_LIST.URL,ListenKey.C2C_LIST);
    await ScrollToEnd_bilimall();
    const data = await pending;
    skuAgentStore.getState().stepCount(data.length);
  }
    
  ListenKey.C2C_LIST = "null";
  useSettingsStore.setState({autoCaptureMall}) // revert autoCaptureMall
}


export async function captureSkuScreenshot(skuid: number) {
  // 准备监听商品详情数据
  const detailPromise = waitForRequest(MALL_DETAIL.JSON_PREFIX, skuid, 30000);
  // 跳转到商品详情页面
  await JumpToComplete(MALL_DETAIL.URL(skuid));
  // 等待获取商品详情数据
  const skuDetail = await detailPromise;

  // // 等待页面加载完成
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 通过evalInConsole执行脚本隐藏外部元素
  await evalInConsole(() => {
    try {
      (document.querySelector('.detail-content') as any).__vue__.canOutsideShow = false;
    } catch (e) {
      return false;
    }
    return true;
  }, []);
  
  // 等待DOM更新
  await new Promise(resolve => setTimeout(resolve, 1000));
  // await waitForFrame();
  
  // 获取截图
  const screenshot = await captureVisibleTab();
  
  // 返回商品详情数据和截图
  return {
    detail: skuDetail,
    screenshot
  };
}
// const skuDetail = document.querySelector('.order-detail').__vue__.servicerSkuList[0].skuList[0];

const ORDER_PAGE_URL = 'https://mall.bilibili.com/orderdetail.html?orderId=4000366603358272&noTitleBar=1';
export async function captureOrderScreenshot(skuDetail:MALL_DETAIL.ItemDetail) {
  ListenKey.ORDER_DETAIL = 'captureOrderScreenshot'
  const detailPromise = waitForRequest(ORDER_DETAIL.JSON_PREFIX, ListenKey.ORDER_DETAIL);
  await JumpToComplete(ORDER_PAGE_URL);
  await detailPromise;
  ListenKey.ORDER_DETAIL = 'null'
  
  type MOD = {
    itemsImg: string;
    itemsName: string;
    skuSpec: string;
    price: number;
  }
  const newM = {
    itemsName: skuDetail.name,
    price: Number(skuDetail.price),
  } as MOD
  const skuInfo = skuDetail.itemsSkuListVO?.specInfoList[0];
  if(skuInfo && skuInfo?.specValueVOList[0]){
    newM.itemsImg = skuInfo?.specValueVOList[0].specValueImg;
    newM.skuSpec = `${skuInfo?.specName}:${skuInfo?.specValueVOList[0].specValueName}`;
  }else {
    newM.itemsImg = skuDetail.itemsSkuListVO?.itemsSkuList[0].img || skuDetail.itemsDepositVO.img;
    newM.skuSpec = `${skuDetail.itemsSkuListVO?.specs[0]}:${skuDetail.itemsSkuListVO?.itemsSkuList[0].specValues[0]}`;
  }

  // await new Promise(resolve => setTimeout(resolve, 1000));
  await waitForFrame();
  console.warn('newM',newM)
  const [ok,err]:[boolean,any] = await evalInConsole(({itemsImg,itemsName,skuSpec,price}:MOD) => {
    try {
      const v = (document.querySelector('.order-detail') as any).__vue__
      v.orderDeliver = null;
      v.orderExpressDetail = null;
      v.orderDetail.moneyDetail.bottomDatas.value = `¥${(Number(price)+10).toFixed(2)}`
      const ps = v.orderDetail.moneyDetail.topDatas
      ps[0].value = `¥${Number(price).toFixed(2)}`
      ps[3].value = `¥${(Number(price)+10).toFixed(2)}`
      v.orderDetail.moneyDetail.topDatas = [ps[0],ps[2],ps[3]] 

      // v.orderBasic.payId = '*'.repeat(v.orderBasic.payId.length||19)
      const o = v.servicerSkuList[0].skuList[0];
      console.warn('o',o)
      o.price = Number(price);
      o.itemsImg = itemsImg;
      o.itemsName = itemsName;
      o.skuSpec = skuSpec;
      
      try {
        document.querySelector('#orderIdText')!.parentElement!.parentElement!.style.visibility = 'hidden';
      } catch (error) {
        return [false,'hide orderIdText failed.']
      }
    } catch (e) {
      return [false,e];
    }
    return [true,null];
  }, [newM]);
  if(!ok) {
    console.error('captureOrderScreenshot failed',err, skuDetail);
    throw Error('captureOrderScreenshot failed');
    // return null;
  }

  await waitForFrame(666);
  console.warn('OrderModDone:',ok)

  const rectL = await evalGetBoundingClientRect('.item-card')
  const rectR = await evalGetBoundingClientRect('.info-card-pay');
  return await captureWithRect({
    x: 0,//rectL.x,
    y: rectL.y,
    width: rectR.winW,//rectR.width,
    height: rectR.y + rectR.height - rectL.y,
    isInViewport: true,
    winW: rectR.winW,
    devicePixelRatio: 2
  })
  
}