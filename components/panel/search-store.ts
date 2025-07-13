import { _create, setFn } from "@/lib/utils";

type SearchState = {
  isOpen: boolean;
  searchType: 'remote' | 'local';
  searchQuery: string;
};

const initialState: SearchState = {
  isOpen: false,
  searchType: 'local',
  searchQuery: '',
};

export const useSearchStore = _create((set: setFn<SearchState>) => ({
  ...initialState,
  
  // 打开搜索模态框
  openSearch: () => set({ isOpen: true, searchQuery: '' }),
  
  // 关闭搜索模态框
  closeSearch: () => set({ isOpen: false }),
  
  // 切换搜索类型
  setSearchType: (searchType: 'remote' | 'local') => set({ searchType }),
  
  // 更新搜索查询
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  
  // 重置搜索状态
  resetSearch: () => set({ ...initialState }),
}));