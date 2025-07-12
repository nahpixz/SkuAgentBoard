import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Check } from 'lucide-react';
import { ModalOverlay } from './modal-overlay';
import { C2C_DETAIL } from '../../entrypoints/panel/api';
import { JumpTo } from '../../entrypoints/panel/tasks';
import { DB } from '../../entrypoints/panel/db';

type CHECK_STATUS = 'pending' | 'doing' | 'success' | 'failed' | 'disable';

type C2CCheckView = {
  removable?: boolean;
  c2cItemsId: number;
  uface: string;
  uname: string;
  showPrice: string;
};

interface InventoryCheckModalProps {
  // isOpen: boolean;
  checkingItem: DB.skuItem | null;
  checkingC2Cs: (C2CCheckView | undefined)[];
  checkStatus: { [key: number | string]: CHECK_STATUS };
  isCheckingInProgress: boolean;
  isCheckingComplete: boolean;
  checkMarketOption: boolean;
  searchNewOption: boolean;
  onCheckMarketOptionChange: (value: boolean) => void;
  onSearchNewOptionChange: (value: boolean) => void;
  onStartCheck: () => void;
  onClose: () => void;
}

export function InventoryCheckModal({
  // isOpen,
  checkingItem,
  checkingC2Cs,
  checkStatus,
  isCheckingInProgress,
  isCheckingComplete,
  checkMarketOption,
  searchNewOption,
  onCheckMarketOptionChange,
  onSearchNewOptionChange,
  onStartCheck,
  onClose
}: InventoryCheckModalProps) {
  if (!checkingItem) return null;

  const getStatusClass = (status: CHECK_STATUS) => {
    if (status === 'doing') {
      return 'bg-gradient-to-r from-blue-50 to-blue-100 animate-pulse border-blue-200';
    } else if (status === 'success') {
      return 'bg-gradient-to-r from-green-50 to-green-100 border-green-200';
    } else if (status === 'failed') {
      return 'bg-gradient-to-r from-red-50 to-red-100 border-red-200 opacity-60';
    } else if (status === 'disable') {
      return 'bg-gray-50 border-gray-200 opacity-60';
    }
    return '';
  };

  const marketStatusClass = getStatusClass('pending');
  const transitionClass = 'transition-all duration-500 ease-in-out';

  return (
    <ModalOverlay
      isOpen={true}
      onClose={onClose}
      alignment="center"
      overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-60"
      contentClassName="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
    >
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-medium text-gray-800">库存检查 - {checkingItem.name}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2"> 
            <div
              key="checkbox-search-new"
              className={`flex items-center justify-between p-2 border rounded-md ${getStatusClass(checkStatus['checkbox-search-new'])}`}
              onClick={() => onSearchNewOptionChange(!searchNewOption)}
            >
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 flex items-center justify-center flex-shrink-0">
                  <Checkbox 
                    defaultChecked
                    checked={searchNewOption}
                    className="h-5 w-5 rounded-full data-[state=checked]:bg-[#786DF6] data-[state=checked]:border-none border-gray-300"
                  />
                </div>
                <span className="text-xs">搜索新库存</span>
              </div>
            </div>
            
            <div
              key="checkbox-check-market"
              className={`flex items-center justify-between p-2 border rounded-md ${marketStatusClass} ${transitionClass}`}
              onClick={() => onCheckMarketOptionChange(!checkMarketOption)}
            >
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 flex items-center justify-center flex-shrink-0">
                  <Checkbox 
                    checked={checkMarketOption}
                    className="h-5 w-5 rounded-full data-[state=checked]:bg-[#786DF6] data-[state=checked]:border-none border-gray-300"
                  />
                </div>
                <span className="text-xs">会员购原价</span>
              </div>
              <span className="text-xs font-medium">
                ¥{checkingItem.c2cLists?.[0]?.showMarketPrice || checkingItem.marketPrice / 100}
              </span>
            </div>

            {checkingC2Cs && checkingC2Cs
              .sort((a, b) => {
                const aDisabled = a?.removable;
                const bDisabled = b?.removable;
                if (aDisabled && !bDisabled) return 1;
                if (!aDisabled && bDisabled) return -1;
                return 0;
              })
              .map((c2c) => {
                if (!c2c?.c2cItemsId) return null;
                
                const status = checkStatus[c2c.c2cItemsId];
                const isDisabled = c2c.removable || status === 'failed';
                
                let statusClass = '';
                if (status === 'doing') {
                  statusClass = 'bg-gradient-to-r from-blue-50 to-blue-100 animate-pulse border-blue-200';
                } else if (status === 'success') {
                  statusClass = 'bg-gradient-to-r from-green-50 to-green-100 border-green-200';
                } else if (status === 'failed') {
                  statusClass = 'bg-gradient-to-r from-red-50 to-red-100 border-red-200 opacity-60';
                } else if (c2c.removable) {
                  statusClass = 'bg-gray-50 border-gray-200 opacity-60';
                }
                
                const transitionClass = isDisabled ? 'transition-all duration-500 ease-in-out' : '';
                
                return (
                  <div 
                    onClick={() => JumpTo(C2C_DETAIL.URL(c2c.c2cItemsId))}
                    key={c2c.c2cItemsId} 
                    className={`flex items-center justify-between p-2 border rounded-md ${statusClass} ${transitionClass}`}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border border-gray-200 flex-shrink-0">
                        {c2c.uface ? (
                          <AvatarImage src={`${c2c.uface}@72w_72h_85q.webp`} alt={c2c.uname || '用户'} />
                        ) : (
                          <AvatarFallback className="text-[10px] bg-gray-100 text-gray-500">
                            {c2c.uname?.substring(0, 1) || '用户'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-xs" title={c2c.uname}>{c2c.uname}</span>
                      <span className="text-xs text-gray-500" title={`ID: ${c2c.c2cItemsId}`}>#{c2c.c2cItemsId}</span>
                    </div>
                    <span className={`text-xs font-medium ${isDisabled ? 'text-gray-400' : 'text-[#786DF6]'}`}>
                      ¥{c2c.showPrice}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4"></div>
            <div className="flex justify-end gap-2">
              <Button 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-1.5 text-xs rounded-md"
                onClick={onClose}
              >
                关闭
              </Button>
              <Button 
                className="px-4 py-1.5 text-xs rounded-md bg-[#786DF6] hover:bg-[#6258D4] text-white disabled:opacity-99 disabled:cursor-not-allowed"
                onClick={onStartCheck}
                disabled={isCheckingInProgress || isCheckingComplete}
              >
                {isCheckingComplete ? (
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    检查完成
                  </span>
                ) : isCheckingInProgress ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    检查中
                  </span>
                ) : (
                  '开始检查'
                )}
              </Button>
            </div>
          </div>
        </div>
    </ModalOverlay>
  );
}