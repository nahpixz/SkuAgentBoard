import { useSettingsStore } from "@/components/panel/settings-store";
import { C2C_LIST, MALL_DETAIL, ORDER_DETAIL } from "@/entrypoints/panel/api";
import { getInspectedUrl, JumpToComplete, waitForRequest } from "@/entrypoints/panel/tasks";
import { skuAgentStore } from "./components/skuFetchAgent";
import { ScrollToEnd_bilimall, evalInConsole, captureVisibleTab, waitForFrame, evalGetBoundingClientRect, captureWithRect } from "./opts";
import { ListenKey } from "@/entrypoints/panel/networkListener";
import { DB } from "@/entrypoints/panel/db";

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
  //使用iPhone 14 pro max的100% 才能正确找到窗口
  const rectL = await evalGetBoundingClientRect('.item-card')
  const rectR = await evalGetBoundingClientRect('.info-card-pay');
  console.log('rectL',rectL)
  console.log('rectR',rectR)
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

const GOOFISH_PRO_ADD = 'https://goofish.pro/sale/product/add?from=%2Fall'
export async function goofishProAddNew(skuItem:DB.skuItem){
  // await JumpToComplete(GOOFISH_PRO_ADD);

  // await waitForFrame();
  const [ok1,err1]:[boolean,any] = await evalInConsole(() => {
    try {
      const $q = (s:string)=>(document.querySelector(s) as any)
      $q('.produect-type-2 .el-radio input').click() //第一个选项-普通商品
    } catch (e) {
      return [false,e];
    }
    return [true,null];
  }, []);
  if(!ok1) throw `上架E1:${err1}`
  
  await waitForFrame(999);
  const [ok2,err2]:[boolean,any] = await evalInConsole(() => {
    try {
      const $q = (s:string)=>(document.querySelector(s) as any)
      const setInput = (label:string,value:any)=> {
        const ipV = $q(`.el-form-item__label[for="${label}"] +div .el-input`).__vue__
        ipV.handleInput({target:{value}})
        return ipV
      }
      $q('.auth-list.custom-element>li').click()
      const ipV = setInput!('channelCat','手办').$parent
      ipV.suggestionSelect(ipV.suggestionList[0])
      $q('.container.custom-style-release').__vue__.pv_list.push(
        'fb9a8d5bf33e218147ad41482caf5b13', //全新未拆封
        '216ff34a76fe9274919b3ac515922d7c', //现货
        '0948659a39e9a59d90b64ccec8afc4cb', //全新无瑕疵
        'f5d311dc4130498b6ee44d672c9ba952', //有原装盒
        // '5def5822bcf50d8a309cf60ad0dae4b2' //景品
      )
      
      
    } catch (e) {
      console.debug('e',e)
      return [false,String(e)];
    }
    return [true,null];
  }, []);
  if(!ok2) throw `上架E2:${err2}`
    
  await waitForFrame(333);
  const [ok3,err3]:[boolean,any] = await evalInConsole(() => {
    try {
      const $q = (s:string)=>(document.querySelector(s) as any)
      const setInput = (label:string,value:any)=> {
        const ipV = $q(`.el-form-item__label[for="${label}"] +div .el-input`).__vue__
        ipV.handleInput({target:{value}})
        return ipV
      }
      
      setInput('title0','标题')
      setInput('original_price','10')
      setInput('price','10')
      
      $q('.el-form-item__label[for="content0"] +div .el-textarea').__vue__.handleInput({target:{value:'详情'}})
      
      const cs = $q('.cs-item .el-select').__vue__
      cs.handleOptionSelect(cs.options[0],true)
      
      $q('.el-form-item__label[for="region_full_name0"] +div .el-select').__vue__.handleFocus()
      const regionDlg = $q('.el-dialog[aria-label="请选择发货区域"]').closest('.dlg-wrape').__vue__
      regionDlg.query.province.id = 110000
      regionDlg.query.province.name = "北京"
      regionDlg.getProvince()
      regionDlg.query.city.id = 110100
      regionDlg.query.city.name = "北京市"
      regionDlg.getCity()
      // regionDlg.getDistrict()
      regionDlg.query.district.id = 110101
      regionDlg.query.district.name = "东城区"
      regionDlg.dlgConfirm()
    } catch (e) {
      console.debug('e',e)
      return [false,String(e)];
    }
    return [true,null];
  }, []);
  if(!ok3) throw `上架E3:${err3}`
  
  await waitForFrame(3333);
  const [ok4,err4]:[boolean,any] = await evalInConsole(() => {
    try {
      const $q = (s:string)=>(document.querySelector(s) as any)
      $q('.cs-item .el-radio input').click()
      $q('.publish-item .el-radio input').click()
      
    } catch (e) {
      console.debug('e',e)
      return [false,String(e)];
    }
    return [true,null];
  }, []);
  if(!ok4) throw `上架E4:${err4}`
  
  // return ;
}



