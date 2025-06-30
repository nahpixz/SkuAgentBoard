// type callbackType =  Parameters<Browser.devtools.network.Request['getContent']>[0];

export namespace MALL_LIST{
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


