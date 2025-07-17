import Dexie, { PromiseExtended, type EntityTable } from "dexie";
import { C2C_DETAIL, C2C_LIST, MARKET_SWG } from "./api";

interface StoredSkuItem extends C2C_LIST.skuItem {
  c2cItemsIds: number[]; // 关联的C2C项目IDs
  c2cLists?: (StoredC2CItem | undefined)[]; //Only for get,Not for put/add
  c2cInfosLastUpdateTime?: number; // 最后一次更新时间
  category?: C2C_LIST.CategoryType;
}

interface StoredC2CItem extends Omit<C2C_LIST.c2cItem, "detailDtoList"> {
  skuItemIds: number[]; // 关联的SKU ItemID
  removable?: boolean; //可删除对象
}

interface BlacklistedC2CItem {
  c2cItemsId: number; // 黑名单中的C2C项目ID
}

const db = new Dexie("BiliC2C_Database") as Dexie & {
  skus: EntityTable<StoredSkuItem, "itemsId">;
  c2cs: EntityTable<StoredC2CItem, "c2cItemsId">;
  blacklist: EntityTable<BlacklistedC2CItem, "c2cItemsId">;
};

db.version(1).stores({
  skus: "itemsId, skuId",
  c2cs: "c2cItemsId",
});

db.version(2).stores({
  skus: "itemsId, skuId",
  c2cs: "c2cItemsId",
  blacklist: "c2cItemsId",
});

async function _putSkuFromC2CItem(c2cIt: C2C_LIST.c2cItem|C2C_DETAIL.c2cItem) {
  for (const skuIt of c2cIt.detailDtoList) {
    const existingSku = await db.skus.get(skuIt.itemsId);
    const c2cItemsIds = existingSku
      ? [...new Set([...existingSku.c2cItemsIds, c2cIt.c2cItemsId])]
      : [c2cIt.c2cItemsId];
    await db.skus.put({
      ...skuIt,
      c2cItemsIds,
      category: c2cIt.category,
      c2cInfosLastUpdateTime: Date.now(),
    });
  }
}

export namespace DB {
  export type skuItem = StoredSkuItem;
  export type c2cItem = StoredC2CItem;
  // export const instance = db;

export async function getSkuList(): Promise<StoredSkuItem[]> {
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

export async function getSkuWithoutC2C(): Promise<StoredSkuItem[]> {
  return db.skus.toArray();
}

export async function countSku(): Promise<number> {
  return db.skus.count();
}

export async function putC2CList(data: C2C_LIST.c2cItem[]): Promise<void> {
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

export async function putC2CDetail(data: C2C_DETAIL.c2cItem) {
  return db.transaction("rw", db.c2cs, db.skus, async () => {
    const { detailDtoList,buyerNotice, ...rest } = data;
    await db.c2cs.put({
      ...rest,
      skuItemIds: detailDtoList.map((it) => it.itemsId),
      removable: data.publishStatus == 2 || data.saleStatus != 1,
    });
    await _putSkuFromC2CItem(data);
  });
}

// 导出数据
export async function exportData(): Promise<string> {
  return db.transaction("r", db.skus, db.c2cs, db.blacklist, async () => {
    const skus = await db.skus.toArray();
    const c2cs = await db.c2cs.toArray();
    const blacklist = await db.blacklist.toArray();
    
    const exportData = {
      version: "2.0",
      timestamp: new Date().toISOString(),
      data: {
        skus,
        c2cs,
        blacklist
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  });
}

// 导入数据
export async function importData(jsonData: string): Promise<void> {
  try {
    const importData = JSON.parse(jsonData);
    
    if (!importData.data || !importData.data.skus || !importData.data.c2cs) {
      throw new Error("无效的数据格式");
    }
    
    return db.transaction("rw", db.skus, db.c2cs, db.blacklist, async () => {
      // 导入新数据
      await db.skus.bulkPut(importData.data.skus);
      await db.c2cs.bulkPut(importData.data.c2cs);
      
      // 导入黑名单数据（如果存在）
      if (importData.data.blacklist) {
        await db.blacklist.bulkPut(importData.data.blacklist);
      }
    });
  } catch (error) {
    throw new Error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 清空所有数据
export async function clearAllData(): Promise<void> {
  return db.transaction("rw", db.skus, db.c2cs, db.blacklist, async () => {
    await db.skus.clear();
    await db.c2cs.clear();
    await db.blacklist.clear();
  });
}

// 移除废弃的C2C项目
export async function removeDeprecatedC2CItems(): Promise<number[]> {
  return db.transaction("rw", db.c2cs, db.blacklist, async () => {
    // 查找所有可移除的C2C项目
    const allItems = await db.c2cs.toArray();
    const removedIds = allItems
                          .filter(item => item.removable === true)
                          .map(x=>x.c2cItemsId);

    await db.blacklist.bulkPut(removedIds.map(c2cItemsId => ({c2cItemsId}) ));
    await db.c2cs.bulkDelete(removedIds);
    return removedIds;
  });
}

// 获取黑名单
export async function getC2CBlacklist(): Promise<Set<number>> {
  const blacklists = await db.blacklist.toCollection().primaryKeys();
  return new Set(blacklists);
}

// 清空黑名单
export async function clearC2CBlacklist(): Promise<void> {
  await db.blacklist.clear();
}

// 装饰器函数：过滤黑名单中的C2C项目（支持单个项目和数组）
export function withC2CBlacklistFilter<T extends (data: (C2C_LIST.c2cItem | C2C_DETAIL.c2cItem) | (C2C_LIST.c2cItem | C2C_DETAIL.c2cItem)[]) => Promise<any>>(
  fn: T
): T {
  return (async (data: (C2C_LIST.c2cItem | C2C_DETAIL.c2cItem) | (C2C_LIST.c2cItem | C2C_DETAIL.c2cItem)[]) => {
    if (Array.isArray(data)) {
      const blacklistSet = await getC2CBlacklist();
      const filteredData = data.filter(item => !blacklistSet.has(item.c2cItemsId));
      return fn(filteredData);
    } else {
      if (await db.blacklist.get(data.c2cItemsId)) {
        return fn(null as any);
      }
      return fn(data);
    }
  }) as T;
}


}