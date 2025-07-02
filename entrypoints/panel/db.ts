import Dexie, { PromiseExtended, type EntityTable } from 'dexie';
import { C2C_LIST } from './api';


interface StoredSkuItem extends C2C_LIST.skuItem {
    c2cItemsIds: number[]; // 关联的C2C项目IDs
    c2cLists?:(StoredC2CItem|undefined)[]; //Only for get,Not for put/add
}

interface StoredC2CItem extends Omit<C2C_LIST.c2cItem, 'detailDtoList'> {
    skuItemIds: number[]; // 关联的SKU ItemID
}

const db = new Dexie('BiliC2C_Database') as Dexie & {
  skus: EntityTable<StoredSkuItem, 'itemsId'>
  c2cs: EntityTable<StoredC2CItem, 'c2cItemsId'>
};

db.version(1).stores({
  skus: 'itemsId, skuId',
  c2cs: 'c2cItemsId'
});


export namespace DB {
    export type skuItem = StoredSkuItem 
    export type c2cItem = StoredC2CItem 
    // export const instance = db;
  export const putC2CList:(data: C2C_LIST.c2cItem[])=>Promise<void> = _putC2CList;
  export const getSkuList = _getSkuList;
}

async function _getSkuList():Promise<StoredSkuItem[]>{
  return db.transaction('r',db.skus,db.c2cs,async()=>{
    const skuIts = await db.skus.toArray();
    await Promise.allSettled(skuIts.map(async(it)=>{
      it.c2cLists = await db.c2cs.bulkGet(it.c2cItemsIds)
      return it;
    }))
    return skuIts
  })
}

async function _putC2CList(data: C2C_LIST.c2cItem[]): Promise<void>{
  return db.transaction('rw', db.c2cs, db.skus, async () => {
      for (const c2cIt of data) {
        const { detailDtoList, ...rest } = c2cIt;
        await db.c2cs.put({
          ...rest,
          skuItemIds: c2cIt.detailDtoList.map(it => it.itemsId)
        })
        for (const skuIt of c2cIt.detailDtoList) {
          const existingSku = await db.skus.get(skuIt.itemsId);
          const c2cItemsIds = existingSku
            ? [...new Set([...existingSku.c2cItemsIds, c2cIt.c2cItemsId])]
            : [c2cIt.c2cItemsId];
          await db.skus.put({
            ...skuIt,
            c2cItemsIds
          })
        }
      }
    })
}


