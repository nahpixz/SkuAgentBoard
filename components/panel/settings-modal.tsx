import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface SettingsModalProps {
  isOpen: boolean;
  autoCaptureMall: boolean;
  autoCaptureDetail: boolean;
  onToggleAutoCaptureMall: () => void;
  onClose: () => void;
}

export function SettingsModal({
  isOpen,
  autoCaptureMall,
  autoCaptureDetail,
  onToggleAutoCaptureMall,
  onClose
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-medium text-gray-800">设置</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div 
            className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
            onClick={onToggleAutoCaptureMall}
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 flex items-center justify-center flex-shrink-0">
                <Checkbox 
                  checked={autoCaptureMall}
                  className="h-5 w-5 rounded-full data-[state=checked]:bg-[#786DF6] data-[state=checked]:border-none border-gray-300"
                />
              </div>
              <span className="text-sm">市集自动抓取</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50 opacity-60">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 flex items-center justify-center flex-shrink-0">
                <Checkbox 
                  checked={autoCaptureDetail}
                  disabled
                  className="h-5 w-5 rounded-full data-[state=checked]:bg-[#786DF6] data-[state=checked]:border-none border-gray-300"
                />
              </div>
              <span className="text-sm">商品详情自动抓取</span>
            </div>
            <span className="text-xs text-gray-500">暂不可用</span>
          </div>
        </div>
      </div>
    </div>
  );
}