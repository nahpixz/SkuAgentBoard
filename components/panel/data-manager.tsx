import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { DB } from '../../entrypoints/panel/db';

interface DataManagerProps {
  onDataChange?: () => void;
}

export function DataManager({ onDataChange }: DataManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const jsonData = await DB.exportData();
      
      // 创建下载链接
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `biliMall-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showMessage('success', '数据导出成功');
    } catch (error) {
      showMessage('error', `导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      await DB.importData(text);
      
      showMessage('success', '数据导入成功');
      onDataChange?.();
    } catch (error) {
      showMessage('error', `导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsImporting(false);
      // 重置文件输入
      event.target.value = '';
    }
  };

  const handleClear = async () => {
    try {
      setIsClearing(true);
      await DB.clearAllData();
      
      showMessage('success', '数据清空成功');
      setShowClearConfirm(false);
      onDataChange?.();
    } catch (error) {
      showMessage('error', `清空失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* 消息提示 */}
      {message && (
        <div className={`p-3 rounded-xl text-sm backdrop-blur-sm transition-all duration-300 ${
          message.type === 'success' 
            ? 'bg-emerald-50/80 text-emerald-700 border border-emerald-200/60 shadow-sm' 
            : 'bg-red-50/80 text-red-700 border border-red-200/60 shadow-sm'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* 导出数据 */}
      <div className="group flex items-center justify-between p-4 rounded-xl border border-gray-200/60 hover:border-blue-300/50 hover:bg-blue-50/30 transition-all duration-200 hover:shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100/80 flex items-center justify-center group-hover:bg-blue-200/80 transition-colors">
            <Download className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-800 left">导出数据</div>
            <div className="text-xs text-gray-500 mt-0.5">将所有数据导出为JSON文件</div>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="bg-blue-500/90 hover:bg-blue-600 text-white border-0 rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
        >
          {isExporting ? (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
              导出中
            </div>
          ) : '导出'}
        </Button>
      </div>

      {/* 导入数据 */}
      <div className="group flex items-center justify-between p-4 rounded-xl border border-gray-200/60 hover:border-emerald-300/50 hover:bg-emerald-50/30 transition-all duration-200 hover:shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100/80 flex items-center justify-center group-hover:bg-emerald-200/80 transition-colors">
            <Upload className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-800">导入数据</div>
            <div className="text-xs text-gray-500 mt-0.5">从JSON文件导入数据（会覆盖现有数据）</div>
          </div>
        </div>
        <div className="relative">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={isImporting}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <Button
            size="sm"
            disabled={isImporting}
            className="bg-emerald-500/90 hover:bg-emerald-600 text-white border-0 rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
          >
            {isImporting ? (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                导入中
              </div>
            ) : '选择文件'}
          </Button>
        </div>
      </div>

      {/* 清空数据 */}
      {!showClearConfirm ? (
        <div className="group flex items-center justify-between p-4 rounded-xl border border-gray-200/60 hover:border-red-300/50 hover:bg-red-50/30 transition-all duration-200 hover:shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100/80 flex items-center justify-center group-hover:bg-red-200/80 transition-colors">
              <Trash2 className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">清空数据</div>
              <div className="text-xs text-gray-500 mt-0.5">删除所有本地数据</div>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowClearConfirm(true)}
            className="bg-red-500/90 hover:bg-red-600 border-0 rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200 hover:shadow-md"
          >
            清空
          </Button>
        </div>
      ) : (
        <div className="p-4 border border-red-200/60 rounded-xl bg-red-50/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-red-800">确认清空数据</span>
          </div>
          <p className="text-xs text-red-700/80 mb-4 leading-relaxed">
            此操作将永久删除所有本地数据，无法恢复。请确认是否继续？
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleClear}
              disabled={isClearing}
              className="bg-red-600 hover:bg-red-700 border-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:opacity-50"
            >
              {isClearing ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                  清空中
                </div>
              ) : '确认清空'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
              className="border-gray-300/60 hover:bg-gray-100/50 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200"
            >
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}