// type callbackType =  Parameters<Browser.devtools.network.Request['getContent']>[0];

export namespace C2C_LIST{
    export const HTML_URL = "https://mall.bilibili.com/neul-next/index.html?page=magic-market_index"
    export const URL = "https://mall.bilibili.com/mall-magic-c/internet/c2c/v2/list"
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
    }

    export function parse(jsonBody:any):c2cItem[]{
        const c2cs:c2cItem[] = jsonBody.data.data;
        return c2cs.filter(x => !x.detailDtoList[0].type)
    }
}


export namespace C2C_DETAIL{
    export const URL = (c2cItemsId:number)=> `https://mall.bilibili.com/neul-next/index.html?page=magic-market_detail&noTitleBar=1&itemsId=${c2cItemsId}&from=market_index`
}


export namespace MALL_DETAIL{
    export const URL = (skuItemsId:number) => `https://mall.bilibili.com/detail.html?from=draw-items&jumpLinkType=0&loadingShow=1&noTitleBar=1#goFrom=na&noReffer=true&itemsId=${skuItemsId}`
}