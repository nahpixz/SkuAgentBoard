import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Check, Trash, X, Bug, ShoppingCart, Search, Upload, Download, 
  Star, StarOff, Layers, ChevronDown, Settings, MoreHorizontal, 
  Filter, RefreshCw, Clipboard, Tag, Package, Hash, CheckCircle
} from 'lucide-react';
import { useSelectStore } from './select-store';
import { useLiveQuery } from 'dexie-react-hooks';
import { DB } from '@/entrypoints/panel/db';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';


export function SelectModeToolbar({handleSelectAll,onClose}:{handleSelectAll: () => void,onClose:()=>void}) {
  // const skuList = useLiveQuery(() => DB.getSkuList());
  const {
    hasSelectedItems,
    hasSelectedC2C,
    selectAll,
    deleteSelected,
    deleteSelectedC2C,
    resetSelection,
  } = useSelectStore();
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 py-1.5 bg-gradient-to-b from-white to-white/95 backdrop-blur-md shadow-sm border-b">
      <div className="max-w-screen-2xl mx-auto px-2">
        <div className="flex items-center justify-between h-10">
          {/* 左侧：选择信息和主要操作 */}
          <div className="flex items-center space-x-1.5">
            {/* 选择操作下拉菜单（已合并选择信息） */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-md text-xs h-7 px-2 border-blue-200 bg-white hover:bg-blue-50 text-blue-600 shadow-sm"
                >
                  {hasSelectedItems ? (
                    <div className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1 fill-blue-100" />
                      <span className="font-semibold mr-0.5">3</span>
                      <span>已选</span>
                    </div>
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      <span>选择</span>
                    </>
                  )}
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuLabel className="text-xs">选择操作</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-xs flex items-center gap-2"
                >
                  <Check className="h-3.5 w-3.5" />
                  全选
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-xs flex items-center gap-2"
                  disabled={!hasSelectedItems}
                >
                  <X className="h-3.5 w-3.5" />
                  取消选择
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-xs flex items-center gap-2"
                  disabled={!hasSelectedItems}
                >
                  <Hash className="h-3.5 w-3.5" />
                  反选
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
          </div>
          
          {/* 中间：功能按钮组 */}
          <div className="flex-1 flex items-start justify-start space-x-1.5 px-2 max-w-3xl mx-auto">
            {/* 删除操作下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-md text-xs h-7 px-2 border-red-100 bg-white hover:bg-red-50 text-red-600 shadow-sm"
                  disabled={!hasSelectedItems}
                >
                  <Trash className="h-3 w-3 mr-1" />
                  删除
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-40">
                <DropdownMenuLabel className="text-xs">删除操作</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs flex items-center gap-2 text-red-600">
                  <Trash className="h-3.5 w-3.5" />
                  删除选中商品
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-xs flex items-center gap-2 text-red-600"
                  disabled={!hasSelectedC2C}
                >
                  <Layers className="h-3.5 w-3.5" />
                  删除c2c库存
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* 检索操作下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-md text-xs h-7 px-2 border-purple-100 bg-white hover:bg-purple-50 text-purple-600 shadow-sm"
                  disabled={!hasSelectedItems}
                >
                  <Search className="h-3 w-3 mr-1" />
                  检索
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuLabel className="text-xs">检索操作</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs flex items-center gap-2 text-purple-600">
                  <Search className="h-3.5 w-3.5" />
                  搜索选中项竞品
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs flex items-center gap-2 text-indigo-600">
                  <Filter className="h-3.5 w-3.5" />
                  筛选选中商品
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs flex items-center gap-2 text-gray-600">
                  <Clipboard className="h-3.5 w-3.5" />
                  复制选中商品信息
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* 上架操作下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-md text-xs h-7 px-2 border-emerald-100 bg-white hover:bg-emerald-50 text-emerald-600 shadow-sm"
                  disabled={!hasSelectedItems}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  上架
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuLabel className="text-xs">上架操作</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs flex items-center gap-2 text-emerald-600">
                  <Upload className="h-3.5 w-3.5" />
                  上架选中商品
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs flex items-center gap-2 text-orange-600">
                  <Download className="h-3.5 w-3.5" />
                  下架选中商品
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs flex items-center gap-2 text-indigo-600">
                  <Tag className="h-3.5 w-3.5" />
                  批量修改价格
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs flex items-center gap-2 text-cyan-600">
                  <RefreshCw className="h-3.5 w-3.5" />
                  刷新选中商品
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* 收藏操作下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-md text-xs h-7 px-2 border-amber-100 bg-white hover:bg-amber-50 text-amber-600 shadow-sm"
                  disabled={!hasSelectedItems}
                >
                  <Star className="h-3 w-3 mr-1" />
                  收藏
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-40">
                <DropdownMenuLabel className="text-xs">收藏操作</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs flex items-center gap-2 text-amber-600">
                  <Star className="h-3.5 w-3.5" />
                  添加到收藏
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs flex items-center gap-2 text-yellow-600">
                  <StarOff className="h-3.5 w-3.5" />
                  从收藏中移除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* 右侧：设置和退出按钮 */}
          <div className="flex items-right space-x-0">
            {/* 调试与检查下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-md text-xs h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  // disabled={!hasSelectedItems}
                >
                  <Bug className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs">调试与检查</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs flex items-center gap-2">
                  <Bug className="h-3.5 w-3.5 text-blue-600" />
                  查看商品详情
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs flex items-center gap-2">
                  <ShoppingCart className="h-3.5 w-3.5 text-green-600" />
                  检查库存
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-xs flex items-center gap-2 text-red-600"
                  disabled={!hasSelectedC2C}
                >
                  <Layers className="h-3.5 w-3.5" />
                  删除c2c库存
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-md text-xs h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs">设置选项</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  显示设置
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5" />
                  刷新页面
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-md text-xs h-8 w-8 p-0 m-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}