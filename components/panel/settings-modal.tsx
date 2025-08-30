import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { DataManager } from './data-manager';
import { ModalOverlay } from './modal-overlay';
import { X } from 'lucide-react';
import { useSettingsStore } from './settings-store';

interface SettingsModalProps {
  onClose:()=>void;
  onDataChange?: () => void;
}

export function SettingsModal({ onClose, onDataChange }: SettingsModalProps) {
  const { autoCaptureMall, autoCaptureDetail, enableLiveQuery, toggleAutoCaptureMall,toggleAutoCaptureDetail, toggleLiveQuery } = useSettingsStore();
  
  // if (!isOpen) return null;

  return (
    <div
      className="relative mt-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-white/20 overflow-hidden text-start"
    >
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
        
        <div className="p-4 space-y-3 max-h-[88vh] overflow-y-auto">
          {/* 自动抓取设置 */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-[#786DF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h4 className="text-sm font-medium text-gray-700">数据读写</h4>
            </div>
            
            <div 
              className={`group flex items-center justify-between p-3 rounded-xl border border-gray-200/60  ${autoCaptureMall?'bg-[#786DF6]/10':'hover:bg-[#786DF6]/5'} hover:border-[#786DF6]/30 transition-all duration-200 cursor-pointer`}
              onClick={toggleAutoCaptureMall}
            >
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={autoCaptureMall}
                  className="h-4 w-4 rounded-md data-[state=checked]:bg-[#786DF6] data-[state=checked]:border-[#786DF6] border-gray-300 transition-colors"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">市集自动抓取</span>
                  <p className="text-xs text-gray-500 mt-0.5">自动捕获市集页面数据</p>
                </div>
              </div>
            </div>
            
            <div 
              className={`group flex items-center justify-between p-3 rounded-xl border border-gray-200/60  ${autoCaptureDetail?'bg-[#786DF6]/10':'hover:bg-[#786DF6]/5'} hover:border-[#786DF6]/30 transition-all duration-200 cursor-pointer`}
              onClick={toggleAutoCaptureDetail}
            >
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={autoCaptureDetail}
                  className="h-4 w-4 rounded-md data-[state=checked]:bg-[#786DF6] data-[state=checked]:border-[#786DF6] border-gray-300 transition-colors"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">商品详情自动抓取</span>
                  {/*<p className="text-xs text-gray-500 mt-0.5">自动捕获数据</p>*/}
                </div>
              </div>
            </div>
            
            {/*<div className="flex items-center justify-between p-3 rounded-xl border border-gray-200/40 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={autoCaptureDetail}
                  disabled
                  className="h-4 w-4 rounded-md border-gray-300 opacity-50"
                />
                <div>
                  <span className="text-sm font-medium text-gray-500">商品详情自动抓取</span>
                  <p className="text-xs text-gray-400 mt-0.5">自动捕获数据</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 bg-gray-200/60 text-gray-500 rounded-full">敬请期待</span>
            </div>*/}

            <div
              className="group flex items-center justify-between p-3 rounded-xl border border-gray-200/60 hover:border-[#786DF6]/30 hover:bg-[#786DF6]/5 transition-all duration-200 cursor-pointer"
              onClick={toggleLiveQuery}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={enableLiveQuery}
                  className="h-4 w-4 rounded-md data-[state=checked]:bg-[#786DF6] data-[state=checked]:border-[#786DF6] border-gray-300 transition-colors"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">实时数据查询</span>
                  <p className="text-xs text-gray-500 mt-0.5">关闭可减少频繁查询，提升性能</p>
                </div>
              </div>
            </div>
        </div>

          {/* 数据管理 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-[#786DF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <h4 className="text-sm font-medium text-gray-700">数据管理</h4>
            </div>
            <DataManager onDataChange={onDataChange} />
          </div>
        </div>
    </div>
  );
}