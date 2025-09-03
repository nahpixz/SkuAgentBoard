import { ModalOverlay } from "@/components/panel/modal-overlay"
import { createT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter} from "@/components/ui/card";
import { Play, Pause, X, SkipForward, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Info, Download } from "lucide-react";
import { JSX, useMemo, useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import "./skuProcessBoard.css";
import { Pipe, ProcessStep, ConfigField } from "../pipe/index";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// 最小必要接口 - 任何对象只需要有一个唯一标识符
interface MinimalItem {
  [key: string]: any;
}

// 获取项目ID的辅助函数
function getItemId(item: MinimalItem): string {
  return String(item.itemsId || item.id || item.key || JSON.stringify(item));
}

// 获取项目名称的辅助函数
function getItemName(item: MinimalItem): string {
  return item.name || item.title || item.label || `项目 #${getItemId(item)}`;
}

// 获取项目图片的辅助函数
function getItemImage(item: MinimalItem): string | undefined {
  return item.img || item.image || item.thumbnail || item.avatar;
}

type StepResult = {
    stepId: string;
    stepName: string;
    result: any;
    success: boolean;
    message?: string;
}

// 处理结果类型 - 泛型化
type ProcessResult<T extends MinimalItem> = {
  item: T;
  stepResults: StepResult[];
};

// 配置表单组件 - 泛型化
const StepConfigForm = <T extends MinimalItem>({
  step,
  itemId,
  isGlobal = false,
  store
}: {
  step: ProcessStep<T>;
  itemId?: string;
  isGlobal?: boolean;
  store: ReturnType<typeof createProcessStore<T>>;
}) => {
  const { globalStepConfigs, itemStepConfigs, updateGlobalStepConfig, updateItemStepConfig } = store();

  // 获取配置值：优先使用item特定配置，否则使用全局配置
  const getConfigValue = (fieldKey: string, defaultValue: any) => {
    if (isGlobal) {
      return globalStepConfigs[step.id]?.[fieldKey] ?? defaultValue;
    }
    if (itemId) {
      return itemStepConfigs[itemId]?.[step.id]?.[fieldKey] ??
             globalStepConfigs[step.id]?.[fieldKey] ??
             defaultValue;
    }
    return defaultValue;
  };

  const updateConfig = (fieldKey: string, value: any) => {
    if (isGlobal) {
      updateGlobalStepConfig(step.id, { [fieldKey]: value });
    } else if (itemId) {
      updateItemStepConfig(itemId, step.id, { [fieldKey]: value });
    }
  };

  if (!step.config || step.config.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 p-2 bg-gray-50 rounded">
      <div className="text-xs font-medium text-gray-600">
        {isGlobal ? '全局配置' : '项目配置'}
      </div>
      {step.config.map((field: ConfigField) => {
        const value = getConfigValue(field.key, field.defaultValue);

        switch (field.type) {
           case 'string':
             return (
               <div key={field.key} className="space-y-1">
                 <label className="text-xs text-gray-600">{field.label}</label>
                 <Input
                   type="text"
                   value={value || ''}
                   onChange={(e) => {
                     updateConfig(field.key, e.target.value);
                   }}
                   className="h-7 text-xs"
                   placeholder={field.placeholder}
                 />
               </div>
             );

          case 'boolean':
            return (
              <div key={field.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`${step.id}-${field.key}-${isGlobal ? 'global' : itemId}`}
                  checked={!!value}
                  onCheckedChange={(checked) => updateConfig(field.key, checked)}
                />
                <label
                  htmlFor={`${step.id}-${field.key}-${isGlobal ? 'global' : itemId}`}
                  className="text-xs text-gray-600"
                >
                  {field.label}
                </label>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

// 创建泛型store工厂函数
function createProcessStore<T extends MinimalItem>() {
  const State = {
    pendingItems: [] as T[],
    processSteps: [] as ProcessStep<T>[],
    running: false,
    currentItemIndex: -1,
    currentStepIndex: 0,
    processResults: [] as ProcessResult<T>[],
    paused: false,
    globalStepConfigs: {} as Record<string, Record<string, any>>,
    itemStepConfigs: {} as Record<string, Record<string, Record<string, any>>>,
  };

  return createT<typeof State>({dev:true})((set, get) => ({
    ...State,
    init: <R,>(pendingItems: T[], pipe: Pipe<T,R>) => {
      // 初始化全局默认配置
      const globalStepConfigs: Record<string, Record<string, any>> = {};
      pipe.steps.forEach(step => {
        if (step.config) {
          globalStepConfigs[step.id] = {};
          step.config.forEach(field => {
            globalStepConfigs[step.id][field.key] = field.defaultValue;
          });
        }
      });

      set({ pendingItems,
        processSteps:pipe.steps,
        processResults:pendingItems.map(item => ({
          item,
          stepResults: []
        })),
        currentItemIndex: -1, currentStepIndex: 0,
        running: false, paused: false,
        globalStepConfigs,
        itemStepConfigs: {}
      });
    },
    clear: () => set({ pendingItems: [], running: false, currentItemIndex: -1, currentStepIndex: 0, processResults: [], paused: false, globalStepConfigs: {}, itemStepConfigs: {} }),
    updateGlobalStepConfig: (stepId: string, config: Record<string, any>) => {
      set(state => ({
        globalStepConfigs: {
          ...state.globalStepConfigs,
          [stepId]: { ...state.globalStepConfigs[stepId], ...config }
        }
      }));
    },
    updateItemStepConfig: (itemId: string, stepId: string, config: Record<string, any>) => {
      set(state => ({
        itemStepConfigs: {
          ...state.itemStepConfigs,
          [itemId]: {
            ...state.itemStepConfigs[itemId],
            [stepId]: { ...state.itemStepConfigs[itemId]?.[stepId], ...config }
          }
        }
      }));
    },
    start: () => {
      set({ running: true, paused: false });
      processNextStep(get);
    },
    pause: () => set({ paused: true }),
    resume: () => {
      set({ paused: false });
      processNextStep(get);
    },
    cancel: () => set({ running: false, paused: false }),
    skipCurrentItem: () => {
      const state = get();
      const nextIndex = state.currentItemIndex + 1;
      if (nextIndex < state.pendingItems.length) {
        set({ currentItemIndex: nextIndex, currentStepIndex: 0 });
        processNextStep(get);
      } else {
        set({ running: false, paused: false });
      }
    },
  }));
}

// 处理下一步的通用函数
async function processNextStep<T extends MinimalItem>(getState: () => any) {
  const state = getState();

  if (!state.running || state.paused) return;

  const { pendingItems, processSteps, currentItemIndex, currentStepIndex, processResults, globalStepConfigs, itemStepConfigs } = state;

  // 检查是否完成所有处理
  if (currentItemIndex >= pendingItems.length) {
    state.set({ running: false });
    return;
  }

  // 获取当前项目和步骤
  let itemIndex = currentItemIndex;
  if (itemIndex === -1) {
    itemIndex = 0;
    state.set({ currentItemIndex: 0 });
  }

  const currentItem = pendingItems[itemIndex];
  const currentStep = processSteps[currentStepIndex];

  if (!currentStep) {
    // 当前项目的所有步骤完成，移动到下一个项目
    const nextIndex = itemIndex + 1;
    if (nextIndex < pendingItems.length) {
      state.set({ currentItemIndex: nextIndex, currentStepIndex: 0 });
      setTimeout(() => processNextStep(getState), 100);
    } else {
      state.set({ running: false });
    }
    return;
  }

  try {
    // 获取配置
    const itemId = getItemId(currentItem);
    const stepConfig = {
      ...globalStepConfigs[currentStep.id],
      ...itemStepConfigs[itemId]?.[currentStep.id]
    };

    // 获取前一步的结果
    const currentResult = processResults[itemIndex];
    const prevStepResult = currentResult?.stepResults[currentStepIndex - 1];

    // 执行步骤
    const result = await currentStep.process(currentItem, prevStepResult?.result, stepConfig);

    // 更新结果
    const stepResult: StepResult = {
      stepId: currentStep.id,
      stepName: currentStep.name,
      result,
      success: true
    };

    const updatedResults = [...processResults];
    if (!updatedResults[itemIndex]) {
      updatedResults[itemIndex] = { item: currentItem, stepResults: [] };
    }
    updatedResults[itemIndex].stepResults[currentStepIndex] = stepResult;

    state.set({
      processResults: updatedResults,
      currentStepIndex: currentStepIndex + 1
    });

    // 继续下一步
    setTimeout(() => processNextStep(getState), 100);

  } catch (error) {
    console.error('步骤执行失败:', error);

    // 记录错误
    const stepResult: StepResult = {
      stepId: currentStep.id,
      stepName: currentStep.name,
      result: null,
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };

    const updatedResults = [...processResults];
    if (!updatedResults[itemIndex]) {
      updatedResults[itemIndex] = { item: currentItem, stepResults: [] };
    }
    updatedResults[itemIndex].stepResults[currentStepIndex] = stepResult;

    state.set({
      processResults: updatedResults,
      currentStepIndex: currentStepIndex + 1
    });

    // 继续下一步（即使出错也继续）
    setTimeout(() => processNextStep(getState), 100);
  }
}

// 进度条组件
const ProgressBar = ({
  className,
  status = 'default'
}: {
  className?: string,
  status?: 'default' | 'success' | 'error' | 'warning' | 'processing'
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500 animate-pulse';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className={cn("w-full bg-gray-200 rounded-full h-1.5", className)}>
      <div
        className={cn("h-1.5 rounded-full transition-all duration-300", getStatusColor())}
        style={{ width: '100%' }}
      />
    </div>
  );
};

// 处理结果项组件 - 泛型化
const ProcessResultItem = <T extends MinimalItem>({
  result,
  index,
  store
}: {
  result?: ProcessResult<T>,
  index: number,
  store: ReturnType<typeof createProcessStore<T>>
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { running, paused, currentItemIndex, currentStepIndex, processSteps } = store();

  const isPending = index > currentItemIndex && !(result?.stepResults?.length);
  const isProcessing = (running || paused) && currentItemIndex === index;
  const lastResultStepId = result?.stepResults.at(-1)?.stepId;
  const thsItemStepIdx = isPending? 0
                        :isProcessing ? currentStepIndex
                        :lastResultStepId ? Math.min(processSteps.findIndex(s=>s.id == lastResultStepId) + 1,processSteps.length)
                        :processSteps.length;
  const hasError = result?.stepResults.some(sr => sr.message);

  const displayItem = result!.item;

  // 根据状态调整组件的显示样式
  const getStatusStyles = () => {
    if (isPending) {
      return {
        border: "border-gray-200",
        hover: "hover:bg-gray-50/30",
        badge: "bg-gray-100 text-gray-700 hover:bg-gray-100",
        badgeText: "待处理"
      };
    } else if (isProcessing) {
      if (hasError){
        return {
          border: "border-red-200",
          hover: "hover:bg-red-50/50",
          badge: "bg-red-200 text-red-800 hover:bg-red-200",
          badgeText: "错误"
        };
      }
      if (paused) {
        return {
          border: "border-amber-300",
          hover: "hover:bg-amber-50/50",
          badge: "bg-amber-200 text-amber-800 hover:bg-amber-200",
          badgeText: `已暂停`
        };
      }
      return {
        border: "border-blue-300",
        hover: "hover:bg-blue-50/50",
        badge: "bg-blue-200 text-blue-800 hover:bg-blue-200 animate-pulse",
        badgeText: `处理中`
      };
    } else if (result?.stepResults.every(sr => sr.success)) {
      return {
        border: "border-green-200",
        hover: "hover:bg-green-50/30",
        badge: "bg-green-100 text-green-800 hover:bg-green-100",
        badgeText: "已完成"
      };
    } else {
      return {
        border: "border-pink-200",
        hover: "hover:bg-pink-50/30",
        badge: "bg-pink-100 text-pink-800 hover:bg-pink-100",
        badgeText: "部分完成"
      };
    }
  };

  const styles = getStatusStyles();

  const cardClassName = cn(
    "mb-3 border rounded-lg overflow-hidden shadow-sm",
    styles.border
  );

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
      className={cardClassName}
    >
      <div className="bg-white">
        <CollapsibleTrigger asChild>
          <div className={cn(
            "flex items-center justify-between p-3 cursor-pointer",
            styles.hover
          )}>
            <div className="flex flex-3 items-center space-x-3">
              {/* 项目图片 - 使用可选表达式 */}
              <div className="relative w-10 h-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                {getItemImage(displayItem) ? (
                  <img
                    src={getItemImage(displayItem)?.startsWith('//') ? `https:${getItemImage(displayItem)}@72w_72h_85q.webp` : getItemImage(displayItem)}
                    alt={getItemName(displayItem)}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    无图
                  </div>
                )}
              </div>

              {/* 项目信息 */}
              <div className="flex-3 min-w-0 flex flex-col">
                <h4 className="text-sm font-medium text-left text-gray-900 truncate pr-1">
                  {getItemName(displayItem)}
                </h4>

                {/* 项目详情 - 使用可选表达式和空字符串兜底 */}
                <div className="flex items-center justify-start mt-0.5 space-x-2 text-[10px] text-gray-500">
                  {/* 价格信息 */}
                  {displayItem.marketPrice && (
                    <span className="text-[10px] font-medium text-blue-600">
                      ¥{(displayItem.marketPrice / 100) || ''}
                    </span>
                  )}

                  {displayItem.price && (
                    <span className="text-[10px] font-medium text-blue-600">
                      ¥{displayItem.price || ''}
                    </span>
                  )}

                  {displayItem.c2cItemsIds?.length && (
                    <span>库存: {displayItem.c2cItemsIds.length || 0}</span>
                  )}

                  <span>ID: {getItemId(displayItem)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center ml-2">
              <Badge className={styles.badge}>
                {styles.badgeText}
              </Badge>
              <div className="ml-2">
                {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-3 pt-0 border-t border-gray-100">
            <div className="space-y-2">
              {/* 已执行步骤显示结果 */}
              {result?.stepResults?.map((stepResult,idx) => (
                <StepResultItem
                  key={stepResult.success?stepResult.stepId:`${stepResult.stepId}_ERR_${idx}`}
                  stepResult={stepResult}
                  status="completed"
                  store={store}
                />
              ))}

              {/* 未执行步骤以待处理状态显示 */}
              {processSteps && (thsItemStepIdx < processSteps.length)&&
                processSteps.slice(thsItemStepIdx).map((step, idx) => {
                  const actualIdx = thsItemStepIdx + idx;
                  const status = isProcessing && actualIdx === currentStepIndex ? 'running' : 'pending';
                  return (
                    <StepResultItem
                      key={step.id}
                      step={step}
                      status={status}
                      index={actualIdx}
                      itemId={getItemId(displayItem)}
                      store={store}
                    />
                  );
                })
              }
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

// 步骤结果项组件 - 泛型化
const StepResultItem = <T extends MinimalItem>({
  step,
  status,
  stepResult,
  index,
  itemId,
  store
}: {
  step?: ProcessStep<T>;
  status: 'completed' | 'running' | 'pending' | 'error';
  stepResult?: StepResult;
  index?: number;
  itemId?: string;
  store: ReturnType<typeof createProcessStore<T>>
}) => {
  const [showConfig, setShowConfig] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return stepResult?.success ?
          <CheckCircle className="w-4 h-4 text-green-600" /> :
          <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return stepResult?.success ? 'text-green-700' : 'text-red-700';
      case 'running':
        return 'text-blue-700';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={cn("text-sm font-medium", getStatusColor())}>
            {step?.name || stepResult?.stepName || '未知步骤'}
          </span>
          {stepResult?.message && (
            <span className="text-xs text-red-600">({stepResult.message})</span>
          )}
        </div>

        {step?.config && itemId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className="h-6 px-2 text-xs"
          >
            配置
          </Button>
        )}
      </div>

      {/* 步骤配置 */}
      {showConfig && step && itemId && (
        <StepConfigForm
          step={step}
          itemId={itemId}
          store={store}
        />
      )}

      {/* 步骤结果渲染 */}
      {stepResult && step?.render && (
        <div className="ml-6 p-2 bg-white border rounded text-xs">
          {step.render(stepResult.result)}
        </div>
      )}
    </div>
  );
};

// 主要的ProcessBoard组件 - 泛型化
export function createProcessBoard<T extends MinimalItem>() {
  const store = createProcessStore<T>();

  const ProcessBoard = () => {
    const {
      pendingItems,
      processSteps,
      running,
      currentItemIndex,
      currentStepIndex,
      processResults,
      paused,
      clear,
      start,
      pause,
      resume,
      cancel,
      skipCurrentItem
    } = store();

    const [showResults, setShowResults] = useState(false);

    // 导出所有stepResults为JSON文件
    const exportStepResults = () => {
      const exportData = {
        exportTime: new Date().toISOString(),
        totalItems: processResults.length,
        processSteps: processSteps.map(step => ({
          id: step.id,
          name: step.name,
          description: step.description
        })),
        results: processResults.map(result => ({
          item: result.item,
          stepResults: result.stepResults.map(stepResult => ({
            stepId: stepResult.stepId,
            stepName: stepResult.stepName,
            success: stepResult.success,
            message: stepResult.message,
            result: stepResult.result
          }))
        }))
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `process-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    const completedCot= currentItemIndex > 0?currentItemIndex: 0;
    const totalItems = pendingItems.length;
    const totalSteps = processSteps.length;

    const currentProcessResult = processResults[currentItemIndex];
    const hasError = currentProcessResult?.stepResults.some(sr => sr.message);

    useEffect(()=> {
      if(completedCot && completedCot==totalItems) setShowResults(true);
    },[completedCot])

    return (
      <ModalOverlay
        isOpen={pendingItems.length > 0}
        onClose={running ? () => { } : clear}
        contentClassName="m-0 w-full max-w-2xl p-0 rounded-lg overflow-hidden shadow-xl"
        zIndex="z-60"
        alignment="center"
      >
        <Card className="border-0 shadow-none p-0 gap-0 bg-white/94 max-h-svh">
          <div className="border-b border-gray-200 p-3 flex flex-col">
            {/* 集成进度显示到标题栏 */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${running ? hasError ? 'bg-red-600' : paused ? 'bg-amber-400' : 'bg-green-500 animate-pulse' : completedCot === totalItems ? 'bg-blue-500' : 'bg-gray-400'}`} />
                      <h1 className="font-bold text-lg text-gray-700">处理队列</h1>
                      <span className="text-xs text-gray-500">
                        {completedCot}/{totalItems}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {processResults.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportStepResults}
                        className="h-7 px-2 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        导出
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clear}
                      disabled={running}
                      className="h-7 px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* 进度条 */}
                <ProgressBar
                  className="mb-2"
                  status={running ? hasError ? 'error' : paused ? 'warning' : 'processing' : completedCot === totalItems ? 'success' : 'default'}
                />

                {/* 状态信息 */}
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>
                    {running ?
                      paused ? '已暂停' :
                      hasError ? '处理中 (有错误)' : '处理中...'
                      : completedCot === totalItems ? '全部完成' : '准备就绪'
                    }
                  </span>
                  {running && (
                    <span>
                      步骤 {currentStepIndex + 1}/{totalSteps}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-0 max-h-96 overflow-y-auto">
            <div className="p-3 space-y-0">
              {processResults.map((result, index) => (
                <ProcessResultItem
                  key={getItemId(result.item)}
                  result={result}
                  index={index}
                  store={store}
                />
              ))}
            </div>
          </CardContent>

          <CardFooter className="border-t border-gray-200 p-3 flex justify-between">
            <div className="flex gap-2">
              {!running ? (
                <Button
                  onClick={start}
                  disabled={pendingItems.length === 0}
                  size="sm"
                  className="h-8"
                >
                  <Play className="w-4 h-4 mr-1" />
                  开始
                </Button>
              ) : (
                <>
                  {paused ? (
                    <Button onClick={resume} size="sm" className="h-8">
                      <Play className="w-4 h-4 mr-1" />
                      继续
                    </Button>
                  ) : (
                    <Button onClick={pause} variant="outline" size="sm" className="h-8">
                      <Pause className="w-4 h-4 mr-1" />
                      暂停
                    </Button>
                  )}
                  <Button onClick={cancel} variant="destructive" size="sm" className="h-8">
                    取消
                  </Button>
                  <Button onClick={skipCurrentItem} variant="outline" size="sm" className="h-8">
                    <SkipForward className="w-4 h-4 mr-1" />
                    跳过
                  </Button>
                </>
              )}
            </div>

            <div className="text-xs text-gray-500">
              {totalItems} 项目 · {totalSteps} 步骤
            </div>
          </CardFooter>
        </Card>
      </ModalOverlay>
    );
  };

  return { ProcessBoard, store };
}

// 导出默认的ProcessBoard (向后兼容)
export const { ProcessBoard, store: processStore } = createProcessBoard<MinimalItem>();
export default ProcessBoard;