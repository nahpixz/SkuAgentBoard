import { useSettingsStore } from "@/components/panel/settings-store";
import { C2C_DETAIL, C2C_LIST, MARKET_SWG } from "./api";

type RequestTypeMap = {
  [MARKET_SWG.JSON_PREFIX]: MARKET_SWG.c2cItem[];
  [C2C_DETAIL.JSON_PREFIX]: C2C_DETAIL.c2cItem;
  [C2C_LIST.URL]: C2C_LIST.c2cItem[];
};
type RequestUrl = keyof RequestTypeMap;
type PromiseResolver = {
  resolve: (data: any) => void;
  reject: (reason?: any) => void;
} | null;
export const pendingPromises:Record<RequestUrl,Map<string|number,PromiseResolver>>
= {
  [MARKET_SWG.JSON_PREFIX]:new Map(),
  [C2C_DETAIL.JSON_PREFIX]:new Map(),
  [C2C_LIST.URL]:new Map(),
}

export async function waitForRequest<T extends RequestUrl>(requestPrefix:T,key:string|number,timeout=20000):Promise<RequestTypeMap[T]> {
  return new Promise((resolve, reject) => {
        const cpM = pendingPromises[requestPrefix] as Map<string|number,PromiseResolver>;
        const timer = setTimeout(() => {
            cpM.delete(key);
            reject(new Error("Timeout waiting for response"));
        }, timeout);

        cpM.set(key,{
            resolve:(x => {
                clearTimeout(timer);
                cpM.delete(key);
                resolve(x);
            }),
            reject:(x => {
                clearTimeout(timer);
                cpM.delete(key);
                reject(x);
            }),
        });
    });
}

export function requestDispatcher<T extends RequestUrl>(requestPrefix:T,key:string|number) {
  const pMap:Map<string|number, PromiseResolver> = pendingPromises[requestPrefix];
  const prom = pMap.get(key);
  if(!prom) return null;
  return {
    dispatch(data:RequestTypeMap[T],error?:any) {
      if(error) prom.reject(error);
      else prom.resolve(data);
      pMap.delete(key);
    },
    ...prom
  } 
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

export function JumpToComplete(url: string){
  return new Promise<void>((resolve,reject)=>{
    const onNavigated = async (id: number, changeInfo: Browser.tabs.TabChangeInfo) => {
      if (id !== browser.devtools.inspectedWindow.tabId) return;
      if (changeInfo.status !== "complete") return;
      console.log('jumped:',url)
      resolve();
      browser.tabs.onUpdated.removeListener(onNavigated)
    };
    browser.tabs.onUpdated.addListener(onNavigated);
    browser.tabs.update(browser.devtools.inspectedWindow.tabId, { url, autoDiscardable: false }).catch(reject);
  })
}

export async function getInspectedUrl() {
  const tab = await browser.tabs.get(browser.devtools.inspectedWindow.tabId)
  return tab.url;
}

export function JumpTo(url: string) {
    return new Promise<void>((resolve,reject)=>{
      const onNavigated = async () => {
        console.log('jump to',url)
        resolve();
        browser.devtools.network.onNavigated.removeListener(onNavigated)
      };
      browser.devtools.network.onNavigated.addListener(onNavigated);


      browser.devtools.inspectedWindow.eval(`window.location.assign("${url}")`,
      (result, e) => {
        if (e) {
          console.error("跳转失败:", e);
          reject(e)
        }
        // console.log('jump to',url)
        // resolve()
      })
    })
    
  }

export function HistoryBack() {
  browser.devtools.inspectedWindow.eval(`history.back();setTimeout(()=>window.history.go(), 200);`,
    (result, error) => {
      if (error) console.error("跳转失败:", error);
    })
}



// let connID = "";
// let connTime = 0;
import { DB } from "./db"
let c2cNextId = "";
export const ListenKey = {
  C2C_LIST:"null",
}
export async function networkListener(
  req: globalThis.Browser.devtools.network.Request
) {
  //   if(!req._connectionId || req._connectionId == connID && req.time == connTime) return //console.debug('reqRet',req._connectionId,req.request.url,req);
  //   connID = String(req._connectionId) || ""
  // console.debug('req',req._connectionId,req.request.url,req)

  if (
    useSettingsStore.getState().autoCaptureMall &&
    req.request.url == C2C_LIST.URL
  ) {
    req.getContent((body, encoding) => {
      const [data, nextId] = C2C_LIST.parse(JSON.parse(body));
      if (nextId == c2cNextId) return;
      c2cNextId = nextId;
      console.log(req._connectionId, "C2C_LIST", nextId, data);
      requestDispatcher(C2C_LIST.URL,ListenKey.C2C_LIST)?.dispatch(data);
      DB.putC2CList(data);
    });
  } else if (C2C_DETAIL.isDetail(req.request.url)) {
    // console.debug('req',req._connectionId,req.request.url,req)
    req.getContent((body, encoding) => {
      try {
        const data = JSON.parse(body).data as C2C_DETAIL.c2cItem;
        console.log(req._connectionId, "C2C_DETAIL", data);
        requestDispatcher(C2C_DETAIL.JSON_PREFIX,data.c2cItemsId)?.dispatch(data);

        DB.putC2CDetail(data);
      } catch (e) {
        console.error(e);
        // requestDispatcher(C2C_DETAIL.JSON_PREFIX,data.c2cItemsId)?.reject(e);
        console.error("req", req._connectionId, req.request.url, req);
      }
    });
  } else if (req.request.url.startsWith(MARKET_SWG.JSON_PREFIX)) {
    // console.warn('checkingPromises',checkingPromises[MARKET_SWG.JSON_PREFIX])
    req.getContent((body, encoding) => {
      try {
        const data = JSON.parse(body).data as MARKET_SWG.c2cItem[];
        console.log(req._connectionId, "MARKET_SWG", data);
        requestDispatcher(MARKET_SWG.JSON_PREFIX,"checkbox-search-new")?.dispatch(data);
      } catch (e) {
        console.error(e);
        requestDispatcher(MARKET_SWG.JSON_PREFIX,"checkbox-search-new")?.reject(e);
        console.error("req", req._connectionId, req.request.url, req);
      }
    });
  }
}