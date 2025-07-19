import { useSettingsStore } from "@/components/panel/settings-store";
import { DB } from "./db"
import { C2C_LIST, C2C_DETAIL, MARKET_SWG, MALL_DETAIL, ORDER_DETAIL } from "./api";
import { requestDispatcher } from "./tasks";

// let connID = "";
// let connTime = 0;
let c2cNextId = "";
export const ListenKey = {
  C2C_LIST:"null",
  ORDER_DETAIL:"null",
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
    const categoryFilter = JSON.parse(req?.request?.postData?.text || "{}")?.categoryFilter;
    req.getContent((body, encoding) => {
      const [data, nextId] = C2C_LIST.parse(JSON.parse(body));
      if (nextId == c2cNextId) return;
      c2cNextId = nextId;
      if(categoryFilter) C2C_LIST.appendCategory(data,categoryFilter);
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
  } else if (MALL_DETAIL.isDetail(req.request.url)) {
    req.getContent((body, encoding) => {
      try {
        const data = JSON.parse(body).data as MALL_DETAIL.ItemDetail;
        console.log(req._connectionId, "MALL_DETAIL", data);
        // 从URL中提取itemsId
        const urlParams = new URLSearchParams(req.request.url.split('?')[1]);
        const itemsId = Number(urlParams.get('itemsId'));
        if (itemsId) {
          requestDispatcher(MALL_DETAIL.JSON_PREFIX, itemsId)?.dispatch(data);
          // 可以考虑添加DB存储逻辑
          // DB.putMallDetail(data);
        }
      } catch (e) {
        console.error(e);
        console.error("req", req._connectionId, req.request.url, req);
      }
    });
  } else if (req.request.url.startsWith(ORDER_DETAIL.JSON_PREFIX)) {
     requestDispatcher(ORDER_DETAIL.JSON_PREFIX, ListenKey.ORDER_DETAIL)?.dispatch(true)
  } 
}