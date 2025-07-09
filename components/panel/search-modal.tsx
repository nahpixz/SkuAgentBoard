import React from 'react';
import { Search, Home, ShoppingCart } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  searchType: 'remote' | 'local';
  searchQuery: string;
  onSearchTypeChange: (type: 'remote' | 'local') => void;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  onClose: () => void;
}

export function SearchModal({
  isOpen,
  searchType,
  searchQuery,
  onSearchTypeChange,
  onSearchQueryChange,
  onSearch,
  onClose
}: SearchModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-2 bg-white/70 backdrop-blur-md shadow-sm border-b flex items-center justify-between">
      <div className="w-full">
        <div className="relative flex items-center">
          {/* 搜索类型选择器 */}
          <div className="relative group">
            <button 
              className="h-8 w-12 flex items-center justify-center text-gray-500 hover:text-[#786DF6] transition-colors border-r border-gray-200/50"
              onClick={() => onSearchTypeChange(searchType === 'local' ? 'remote' : 'local')}
            >
              {searchType === 'local' ? (
                <Home className="h-4 w-4" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </button>
            
            {/* Hover 下拉菜单 */}
            <div className="absolute top-4/5 left-0 mt-1 w-32 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
              <div className="bg-white rounded-lg shadow-xl border border-gray-200/50 overflow-hidden">
                <button 
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                    searchType === 'local' 
                      ? 'bg-[#786DF6]/10 text-[#786DF6]' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  onClick={() => onSearchTypeChange('local')}
                >
                  <Home className="h-3 w-3" />
                  <span>本地搜索</span>
                </button>
                <button 
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                    searchType === 'remote' 
                      ? 'bg-[#786DF6]/10 text-[#786DF6]' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  onClick={() => onSearchTypeChange('remote')}
                >
                  <ShoppingCart className="h-3 w-3" />
                  <span>远程搜索</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* 搜索输入框 */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder={searchType === 'local' ? "搜索本地商品名称或SKU..." : "搜索远程商品..."}
            className="flex-1 h-8 px-4 text-sm bg-transparent border-none focus:outline-none placeholder:text-gray-400"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearch();
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
          />
          
          {/* 搜索按钮 */}
          <button 
            className="h-8 w-12 flex items-center justify-center text-gray-400 hover:text-[#786DF6] hover:bg-gray-50/50 transition-colors"
            onClick={onSearch}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}