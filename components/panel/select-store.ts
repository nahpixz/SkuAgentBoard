import { _create, setFn } from "@/lib/utils";

type SelectState = {
  isSelectMode: boolean;
  selectedItems: { [key: number]: boolean };
  selectedC2CItems: { [key: number]: boolean };
  hasSelectedItems: boolean;
  hasSelectedC2C: boolean;
};

const initialState: SelectState = {
  isSelectMode: false,
  selectedItems: {},
  selectedC2CItems: {},
  hasSelectedItems: false,
  hasSelectedC2C: false,
};

export const useSelectStore = _create((set: setFn<SelectState>) => ({
  ...initialState,
  
  // 切换选择模式
  toggleSelectMode: () => {
    set((state) => {
      if (state.isSelectMode) {
        // 退出选择模式时清空选择
        return {
          isSelectMode: false,
          selectedItems: {},
          selectedC2CItems: {},
          hasSelectedItems: false,
          hasSelectedC2C: false,
        };
      } else {
        // 进入选择模式
        return {
          isSelectMode: true,
        };
      }
    });
  },
  
  // 选择/取消选择商品
  toggleSelectItem: (itemId: number) => {
    set((state) => {
      const newSelectedItems = { ...state.selectedItems };
      newSelectedItems[itemId] = !newSelectedItems[itemId];
      
      // 更新是否有选中商品的状态
      const hasSelectedItems = Object.values(newSelectedItems).some(v => v);
      
      return {
        selectedItems: newSelectedItems,
        hasSelectedItems,
      };
    });
  },
  
  // 选择/取消选择C2C库存
  toggleSelectC2C: (c2cItemId: number) => {
    set((state) => {
      const newSelectedC2CItems = { ...state.selectedC2CItems };
      newSelectedC2CItems[c2cItemId] = !newSelectedC2CItems[c2cItemId];
      
      // 更新是否有选中C2C库存的状态
      const hasSelectedC2C = Object.values(newSelectedC2CItems).some(v => v);
      
      return {
        selectedC2CItems: newSelectedC2CItems,
        hasSelectedC2C,
      };
    });
  },
  
  // 选择所有项目
  selectAll: (skuList: any[]) => {
    set((state) => {
      const newSelectedItems: { [key: number]: boolean } = {};
      skuList?.forEach(item => {
        newSelectedItems[item.itemsId] = true;
      });
      
      return {
        selectedItems: newSelectedItems,
        hasSelectedItems: Boolean(skuList && skuList.length > 0),
      };
    });
  },
  
  // 删除选中商品
  deleteSelected: () => {
    console.log('删除选中商品');
    set({
      selectedItems: {},
      hasSelectedItems: false,
    });
  },
  
  // 删除选中c2c库存
  deleteSelectedC2C: () => {
    console.log('删除选中c2c库存');
    set({
      selectedC2CItems: {},
      hasSelectedC2C: false,
    });
  },
  
  // 重置选择状态
  resetSelection: () => {
    set({
      selectedItems: {},
      selectedC2CItems: {},
      hasSelectedItems: false,
      hasSelectedC2C: false,
    });
  },
}));