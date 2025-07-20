import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DB } from '@/entrypoints/panel/db';
import { skuProcessStore } from './skuProcessBoard';

// 定义示例处理步骤
const exampleProcessSteps = [
  {
    id: 'fetch-details',
    name: '获取详情',
    description: '从API获取SKU详细信息',
    process: async (item: DB.skuItem) => {
      // 模拟API请求
      console.log(`获取SKU详情: ${item.name || item.itemsId}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      // 返回处理结果
      return {
        status: 'success',
        details: {
          name: item.name || `商品 #${item.itemsId}`,
          price: item.marketPrice ? item.marketPrice/100 : Math.floor(Math.random() * 100) + 50,
          category: item.category || ['2312', '2331', '2066', '2273'][Math.floor(Math.random() * 4)],
          updateTime: new Date().toISOString()
        }
      };
    }
  },
  {
    id: 'update-price',
    name: '更新价格',
    description: '更新SKU的最新价格信息',
    process: async (item: DB.skuItem) => {
      console.log(`更新价格: ${item.name || item.itemsId}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      // 返回处理结果
      const oldPrice = item.marketPrice ? item.marketPrice/100 : 0;
      const newPrice = oldPrice > 0 ? oldPrice * (0.9 + Math.random() * 0.2) : Math.floor(Math.random() * 100) + 50;
      return {
        oldPrice: oldPrice.toFixed(2),
        newPrice: newPrice.toFixed(2),
        priceDiff: (newPrice - oldPrice).toFixed(2),
        updateTime: new Date().toISOString()
      };
    }
  },
  {
    id: 'check-inventory',
    name: '检查库存',
    description: '检查SKU的库存状态',
    process: async (item: DB.skuItem) => {
      console.log(`检查库存: ${item.name || item.itemsId}`);
      await new Promise(resolve => setTimeout(resolve, 6000));
      // 返回处理结果
      const inventoryCount = item.c2cItemsIds?.length || 0;
      const availableCount = Math.min(inventoryCount, Math.floor(Math.random() * 5) + 1);
      return {
        total: inventoryCount,
        available: availableCount,
        status: availableCount > 0 ? '有库存' : '无库存',
        locations: [
          { name: '仓库A', count: Math.floor(availableCount / 2) },
          { name: '仓库B', count: availableCount - Math.floor(availableCount / 2) }
        ]
      };
    }
  },
  {
    id: 'update-database',
    name: '更新数据库',
    description: '将处理结果保存到数据库',
    process: async (item: DB.skuItem) => {
      console.log(`更新数据库: ${item.name || item.itemsId}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      // 返回处理结果
      return {
        updated: true,
        timestamp: new Date().toISOString(),
        fields: ['price', 'inventory', 'details'],
        recordId: `DB-${item.itemsId}-${Date.now()}`
      };
    }
  }
];

// 示例组件，展示如何使用skuProcessBoard
export const SkuProcessExample = () => {
  // 模拟一些SKU项目
  const mockSkuItems: DB.skuItem[] = [
    { 
      itemsId: 1001, 
      skuId: 'SKU001', 
      name: '哔哩哔哩 22夏 小电视毛绒抱枕', 
      c2cItemsIds: [1, 2, 3], 
      img: '//i0.hdslb.com/bfs/mall/item/nf/n1/202207/8c8d76f4e6934f0f.jpg',
      marketPrice: 12900,
      category: '2331',
      blindBoxId: 0,
      isHidden: false,
      type: 0
    } as DB.skuItem,
    { 
      itemsId: 1002, 
      skuId: 'SKU002', 
      name: '哔哩哔哩 22冬 小电视手办', 
      c2cItemsIds: [4, 5], 
      img: '//i0.hdslb.com/bfs/mall/item/nf/n1/202211/a9c4c0e8e6a34f0f.jpg',
      marketPrice: 29900,
      category: '2312',
      blindBoxId: 0,
      isHidden: false,
      type: 0
    } as DB.skuItem,
    { 
      itemsId: 1003, 
      skuId: 'SKU003', 
      name: '哔哩哔哩 22秋 33娘手办', 
      c2cItemsIds: [6], 
      img: '//i0.hdslb.com/bfs/mall/item/nf/n1/202209/5d7c76f4e6934f0f.jpg',
      marketPrice: 39900,
      category: '2312',
      blindBoxId: 0,
      isHidden: false,
      type: 0
    } as DB.skuItem,
    { 
      itemsId: 1004, 
      skuId: 'SKU004', 
      name: '哔哩哔哩 23春 小电视挂件', 
      c2cItemsIds: [7, 8, 9, 10], 
      img: '//i0.hdslb.com/bfs/mall/item/nf/n1/202303/7c8d76f4e6934f0f.jpg',
      marketPrice: 5900,
      category: '2331',
      blindBoxId: 0,
      isHidden: false,
      type: 0
    } as DB.skuItem,
    { 
      itemsId: 1005, 
      skuId: 'SKU005', 
      name: '哔哩哔哩 23夏 22娘手办', 
      c2cItemsIds: [11, 12], 
      img: '//i0.hdslb.com/bfs/mall/item/nf/n1/202306/9c8d76f4e6934f0f.jpg',
      marketPrice: 35900,
      category: '2312',
      blindBoxId: 0,
      isHidden: false,
      type: 0
    } as DB.skuItem,
  ];

  // 初始化处理队列的函数
  const initProcessQueue = () => {
    skuProcessStore.getState().init(mockSkuItems, exampleProcessSteps);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">SKU处理队列示例</h2>
      <p className="mb-4 text-sm text-gray-600">
        点击下面的按钮初始化处理队列，将会打开处理面板。
      </p>
      <Button onClick={initProcessQueue}>
        初始化处理队列
      </Button>
    </div>
  );
};