// type callbackType =  Parameters<Browser.devtools.network.Request['getContent']>[0];

export namespace C2C_LIST{
    export const HTML_URL = "https://mall.bilibili.com/neul-next/index.html?page=magic-market_index"
    export const URL = "https://mall.bilibili.com/mall-magic-c/internet/c2c/v2/list"
    export enum CategoryType{
        Figure = '2312', //手办
        Goods = '2331', //周边
        Model= '2066', //模型，一般都是高达
        _3C = '2273', //数码
    }
    export type skuItem = {
        blindBoxId:number
        img:string
        isHidden:boolean
        itemsId:number
        marketPrice:number
        name:string
        skuId:number
        type:1|0
    }
    export type c2cItem = {
        c2cItemsId: number
        c2cItemsName: string
        detailDtoList:skuItem[]
        isMyPublish: boolean
        paymentTime: number
        price: number
        showMarketPrice: string
        showPrice: string
        totalItemsCount: 1 | 0
        type: 1 | 0
        uface: string
        uid: string
        uname: string
        uspaceJumpUrl: string | null

        category?:CategoryType
    }

    export function parse(jsonBody:any):[c2cItem[],string]{
        const c2cs:c2cItem[] = jsonBody.data.data;
        return [c2cs.filter(x => !x.detailDtoList[0].type),jsonBody.data.nextId]
    }

    export function appendCategory(c2cs:c2cItem[],category:CategoryType){
        // if(!Object.values(CategoryType).includes(category)) return;
        c2cs.forEach(x => {
            x.category = category
        })
    }
}


export namespace C2C_DETAIL{
    export const URL = (c2cItemsId:number)=> `https://mall.bilibili.com/neul-next/index.html?page=magic-market_detail&noTitleBar=1&itemsId=${c2cItemsId}&from=market_index`
    export const JSON_PREFIX = "https://mall.bilibili.com/mall-magic-c/internet/c2c/items/queryC2cItemsDetail"
    export function isDetail(url:string){
        return url.startsWith(JSON_PREFIX)
    }
    export type skuItem = C2C_LIST.skuItem &{
        showMarketPrice: number,
        forbidExchange: boolean,
        isDraw: boolean,
        style: 1|0,
        boxItemsId: number,
        boxSkuId: number,
        predictArriveTime: null,
        cateName:string; 
    }
    export type c2cItem = C2C_LIST.c2cItem &{
        detailDtoList:skuItem[]
        marketPrice: number,
        remainSecond: number,
        publishStatus: number,
        dropReason: string,
        isMyBuyer: boolean,
        saleStatus: 1|0,
        buyerUid: string | null,
        buyerName: string | null,
        buyerFace: string | null,
        buyerNotice: string | null,
        saleTime: number,
        startBuyTime: number,
        publishTime: number,
        orderId: string | null,
        hiddenFudaiImg: string,
    }
    
}


export namespace MALL_DETAIL{
    export const URL = (skuItemsId:number) => `https://mall.bilibili.com/detail.html?from=draw-items&jumpLinkType=0&loadingShow=1&noTitleBar=1#goFrom=na&noReffer=true&itemsId=${skuItemsId}`
}

export namespace MARKET_SWG{
    export const JSON_PREFIX = "https://api.s-wg.net/market/searchItemHistory"
    
    export const HTML_URL = 'https://market.s-wg.net/#/search'
    export const ITEM_URL = (skuId:number)=> `https://market.s-wg.net/#/history/${skuId}`

    export type c2cItem = {
        c2cItemsId: number,
        price: number,
        userName: string,
        userId: string,
        isSold: boolean,
        isBlacklist: boolean,
        createTime: string,
        updateTime: string
    }
    export function filterLatestRecords(data:c2cItem[]) {
        const groupMap = new Map();
        // 遍历数据，按 userId + userName + price 分组
        data.forEach(item => {
            const key = `${item.userId}_${item.userName}`; //_${item.price}
            if (!groupMap.has(key)) {
                groupMap.set(key, []);
            }
            groupMap.get(key).push(item);
        });
        
        // 对每组数据按 createTime 降序排序，并取第一条（最新记录）
        const result:c2cItem[] = [];
        groupMap.forEach(group => {
            group.sort((a:c2cItem, b:c2cItem) => 
                Date.parse(b.createTime) -  Date.parse(a.createTime)
            );
            result.push(group[0]);
        });
        
        return result;
    }
}

export namespace GOOFISH{
    export const HOME_URL = "https://ssr.m.goofish.com/wow/moyu/moyu-project/anime-app/pages/home?stage=rank"
    export const SEARCH_URL = "https://ssr.m.goofish.com/wow/moyu/moyu-project/fish-anime-category/pages/categorySearch"
}