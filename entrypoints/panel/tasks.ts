import { MARKET_SWG } from "./api";

export async function waitSearchNew(timeout=5000):Promise<MARKET_SWG.c2cItem[]> {
    return new Promise((resolve, reject) => {
        const listener = async function (req:globalThis.Browser.devtools.network.Request) {
            if (req.request.url.startsWith(MARKET_SWG.URL_searchItemHistory)) {
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