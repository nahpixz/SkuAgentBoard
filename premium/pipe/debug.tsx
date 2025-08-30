import { DB } from "@/entrypoints/panel/db";
import { createPipe } from ".";
import { captureOrderScreenshot, captureSkuScreenshot,goofishProAddNew } from "../agent";
import { skuProcessStore } from "../components/skuProcessBoard";
import { exportCBOR } from "../opts";

export const debugPipe = createPipe<DB.skuItem>()
  .addStep({
    id: 'capture-sku-screenshot',
    name: '获取SKU截图',
    description: '捕获商品详情和截图',
    process: async (item: DB.skuItem) => {
      return await captureSkuScreenshot(item.itemsId);
    },
    render: (result) => {
      if (result?.detail) {
        return (
          <div className="p-2 border rounded">
            <h4 className="font-bold">商品详情:</h4>
            <p>ID: {result.detail.itemsId}</p>
            <p>名称: {result.detail.name}</p>
            {result.screenshot && (
              <div>
                <h5 className="font-semibold mt-2">截图:</h5>
                <img src={result.screenshot} alt="SKU截图" className="max-w-xs" />
              </div>
            )}
          </div>
        );
      }
      return <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>;
    }
  })
  .addStep({
    id: 'capture-order-screenshot',
    name: '获取订单截图',
    description: '捕获订单截图',
    process: async (item: DB.skuItem, prev) => {
      const screenshotB = prev && await captureOrderScreenshot(prev.detail);
      return { screenshotA:prev?.screenshot, screenshotB };
    },
    render: (result) => {
      if (result?.screenshotB) {
        return (
          <div className="p-2 border rounded">
            <h4 className="font-bold">订单截图:</h4>
            <img src={result.screenshotB} alt="订单截图" className="max-w-xs" />
          </div>
        );
      }
      return <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>;
    }
  })
  .addStep({
    id: 'goofish-pro-new',
    name: '闲鱼上架',
    description: '闲鱼新商品',
    process: async(item: DB.skuItem, prev)=>{
      // goofishProAddNew(item,)
    },
    // render:(result)=>{
      
    // }
  })
;

export const debugGooFishPipe = createPipe<DB.skuItem>()
  .addStep({
    id: 'goofish-pro-new',
    name: '闲鱼上架',
    description: '闲鱼新商品',
    process: async(item: DB.skuItem, prev)=>{
      return goofishProAddNew(item)
    },
    // render:(result)=>{
      
    // }
  })

// 模拟一个SKU项目用于测试
const mockSkuItem: DB.skuItem = {
  itemsId: 10919349,
  skuId: 10919349,
  name: '测试商品',
  img: '',
  marketPrice: 100,
  blindBoxId: 0,
  isHidden: false,
  type: 1,
  c2cItemsIds: []
};

export const debugPipeRun=(item:DB.skuItem[] = [mockSkuItem])=>{
  skuProcessStore.getState().init(item, debugGooFishPipe);
}

export const debugExportCBOR=(item:DB.skuItem[])=>{
  exportCBOR(item,'debug.cbor');
}

   