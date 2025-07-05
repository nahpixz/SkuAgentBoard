import { C2C_DETAIL, MARKET_SWG } from "./api";

type RequestTypeMap = {
  [MARKET_SWG.JSON_PREFIX]: MARKET_SWG.c2cItem[];
  [C2C_DETAIL.JSON_PREFIX]: C2C_DETAIL.c2cItem;
};
type RequestKey = keyof RequestTypeMap;
type PromiseResolver = {
  resolve: (data: any) => void;
  reject: (reason?: any) => void;
} | null;
export const checkingPromises:Record<RequestKey,{resolve:(v:any) => void,reject:(v:any) => void}|null>
= {
  [MARKET_SWG.JSON_PREFIX]:null,
  [C2C_DETAIL.JSON_PREFIX]:null,
}

export async function waitForRequest<T extends RequestKey>(requestPrefix:T,timeout=20000):Promise<RequestTypeMap[T]> {
  return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            checkingPromises[requestPrefix]=null;
            reject(new Error("Timeout waiting for response"));
        }, timeout);

        checkingPromises[requestPrefix]={
            resolve:(x => {
                clearTimeout(timer);
                checkingPromises[requestPrefix]=null;
                resolve(x);
            }),
            reject:(x => {
                clearTimeout(timer);
                checkingPromises[requestPrefix]=null;
                reject(x);
            }),
        };
    });
}

export async function ListerSearchNew(timeout=10000):Promise<MARKET_SWG.c2cItem[]> {
    return new Promise((resolve, reject) => {
        const listener = async function (req:globalThis.Browser.devtools.network.Request) {
            if (req.request.url.startsWith(MARKET_SWG.JSON_PREFIX)) {
                // const sku_id = Number(req.request.queryString.find(x => x.name == 'sku_id')?.value);
                req.getContent((body, encoding) => {
                    const data = (JSON.parse(body)).data as MARKET_SWG.c2cItem[]
                    console.log(req._connectionId, 'MARKET_SWG', data)

                    browser.devtools.network.onRequestFinished.removeListener(listener)
                    resolve(data)
                    // if(sku_id) DB.putC2CSeachHistory(data,sku_id);

                })
            }
        }

         browser.devtools.network.onRequestFinished.addListener(listener)

         const timeoutId = setTimeout(() => {
            browser.devtools.network.onRequestFinished.removeListener(listener);
            reject(new Error("Request timed out after 10 seconds"));
        }, timeout);
    })
}

export function ToC2cSearch(sku_id:number){
    //@ts-ignore
    function _jump(id) {
        const prefix = "https://market.s-wg.net/#/history/"
        if(!window.location.href.startsWith(prefix)){
            window.location.assign(prefix+id)
        }else{
            //@ts-ignore
            const router = window.app.__vue_app__.config.globalProperties.$router
            router.push(`/history/${id}`)
            setTimeout(router.go, 50);
        }
    }

    return new Promise<void>((resolve,reject)=>{
      browser.devtools.inspectedWindow.eval(`(${_jump.toString()})(${sku_id})`,
      (result, e) => {
        if (e) {
          console.error("跳转失败:", e);
          reject(e)
        }
        console.log('[ToC2cSearch]',sku_id)
        resolve()
      })
    })
}

export function JumpTo(url: string) {
    return new Promise<void>((resolve,reject)=>{
      browser.devtools.inspectedWindow.eval(`window.location.assign("${url}")`,
      (result, e) => {
        if (e) {
          console.error("跳转失败:", e);
          reject(e)
        }
        console.log('jump to',url)
        resolve()
      })
    })
    
  }

export function HistoryBack() {
browser.devtools.inspectedWindow.eval(`history.back();setTimeout(()=>window.history.go(), 200);`,
    (result, error) => {
    if (error) console.error("跳转失败:", error);
    })
}