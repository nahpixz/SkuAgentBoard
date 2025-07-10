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
    <div className="space-y-4">
      {/* 消息提示 */}
      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* 导出数据 */}
      <div className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-blue-500" />
          <div>
            <div className="text-sm font-medium">导出数据</div>
            <div className="text-xs text-gray-500">将所有数据导出为JSON文件</div>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isExporting ? '导出中...' : '导出'}
        </Button>
      </div>

      {/* 导入数据 */}
      <div className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-green-500" />
          <div>
            <div className="text-sm font-medium">导入数据</div>
            <div className="text-xs text-gray-500">从JSON文件导入数据（会覆盖现有数据）</div>
          </div>
        </div>
        <div className="relative">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={isImporting}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button
            size="sm"
            disabled={isImporting}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {isImporting ? '导入中...' : '选择文件'}
          </Button>
        </div>
      </div>

      {/* 清空数据 */}
      {!showClearConfirm ? (
        <div className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-500" />
            <div>
              <div className="text-sm font-medium">清空数据</div>
              <div className="text-xs text-gray-500">删除所有本地数据</div>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowClearConfirm(true)}
          >
            清空
          </Button>
        </div>
      ) : (
        <div className="p-3 border border-red-200 rounded-md bg-red-50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">确认清空数据</span>
          </div>
          <p className="text-xs text-red-600 mb-3">
            此操作将永久删除所有本地数据，无法恢复。请确认是否继续？
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleClear}
              disabled={isClearing}
            >
              {isClearing ? '清空中...' : '确认清空'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
            >
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}