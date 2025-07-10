import Dexie, { PromiseExtended, type EntityTable } from "dexie";
import { C2C_DETAIL, C2C_LIST, MARKET_SWG } from "./api";

interface StoredSkuItem extends C2C_LIST.skuItem {
  c2cItemsIds: number[]; // 关联的C2C项目IDs
  c2cLists?: (StoredC2CItem | undefined)[]; //Only for get,Not for put/add
  c2cInfosLastUpdateTime?: number; // 最后一次更新时间
}

interface StoredC2CItem extends Omit<C2C_LIST.c2cItem, "detailDtoList"> {
  skuItemIds: number[]; // 关联的SKU ItemID
  removable?: boolean; //可删除对象
}

const db = new Dexie("BiliC2C_Database") as Dexie & {
  skus: EntityTable<StoredSkuItem, "itemsId">;
  c2cs: EntityTable<StoredC2CItem, "c2cItemsId">;
};

db.version(1).stores({
  skus: "itemsId, skuId",
  c2cs: "c2cItemsId",
});

export namespace DB {
  export type skuItem = StoredSkuItem;
  export type c2cItem = StoredC2CItem;
  // export const instance = db;
  export const getSkuList = _getSkuList;
  export const putC2CSeachHistory: (
    data: MARKET_SWG.c2cItem[],
    skuId: number
  ) => Promise<void> = _putC2CSeachHistory;
  export const putC2CList: (data: C2C_LIST.c2cItem[]) => Promise<void> =
    _putC2CList;
  export const exportData = _exportData;
  export const importData = _importData;
  export const clearAllData = _clearAllData;

  export function putC2CDetail(data: C2C_DETAIL.c2cItem) {
    return db.transaction("rw", db.c2cs, db.skus, async () => {
      const { detailDtoList, ...rest } = data;
      await db.c2cs.put({
        ...rest,
        skuItemIds: detailDtoList.map((it) => it.itemsId),
        removable: data.publishStatus == 2 || data.saleStatus != 1,
      });
      await _putSkuFromC2CItem(data);
    });
  }
}

async function _getSkuList(): Promise<StoredSkuItem[]> {
  return db.transaction("r", db.skus, db.c2cs, async () => {
    const skuIts = await db.skus.toArray();
    await Promise.allSettled(
      skuIts.map(async (it) => {
        it.c2cLists = await db.c2cs.bulkGet(it.c2cItemsIds);
        return it;
      })
    );
    return skuIts;
  });
}

async function _putC2CSeachHistory(data: MARKET_SWG.c2cItem[], skuId: number) {
  return db.transaction("rw", db.c2cs, db.skus, async () => {});
}

async function _putC2CList(data: C2C_LIST.c2cItem[]): Promise<void> {
  return db.transaction("rw", db.c2cs, db.skus, async () => {
    for (const c2cIt of data) {
      const { detailDtoList, ...rest } = c2cIt;
      await db.c2cs.put({
        ...rest,
        skuItemIds: c2cIt.detailDtoList.map((it) => it.itemsId),
      });
      await _putSkuFromC2CItem(c2cIt);
    }
  });
}

async function _putSkuFromC2CItem(c2cIt: C2C_LIST.c2cItem|C2C_DETAIL.c2cItem) {
  for (const skuIt of c2cIt.detailDtoList) {
    const existingSku = await db.skus.get(skuIt.itemsId);
    const c2cItemsIds = existingSku
      ? [...new Set([...existingSku.c2cItemsIds, c2cIt.c2cItemsId])]
      : [c2cIt.c2cItemsId];
    await db.skus.put({
      ...skuIt,
      c2cItemsIds,
    });
  }
}

// 导出数据
async function _exportData(): Promise<string> {
  return db.transaction("r", db.skus, db.c2cs, async () => {
    const skus = await db.skus.toArray();
    const c2cs = await db.c2cs.toArray();
    
    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      data: {
        skus: skus.map(sku => {
          const { c2cLists, ...rest } = sku;
          return rest;
        }),
        c2cs
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  });
}

// 导入数据
async function _importData(jsonData: string): Promise<void> {
  try {
    const importData = JSON.parse(jsonData);
    
    if (!importData.data || !importData.data.skus || !importData.data.c2cs) {
      throw new Error("无效的数据格式");
    }
    
    return db.transaction("rw", db.skus, db.c2cs, async () => {
      // 清空现有数据
      await db.skus.clear();
      await db.c2cs.clear();
      
      // 导入新数据
      await db.skus.bulkAdd(importData.data.skus);
      await db.c2cs.bulkAdd(importData.data.c2cs);
    });
  } catch (error) {
    throw new Error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 清空所有数据
async function _clearAllData(): Promise<void> {
  return db.transaction("rw", db.skus, db.c2cs, async () => {
    await db.skus.clear();
    await db.c2cs.clear();
  });
}
