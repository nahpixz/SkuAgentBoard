import { ModalOverlay } from "@/components/panel/modal-overlay"
import { DB } from "@/entrypoints/panel/db";
import { createT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, X, SkipForward, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Package, Tag, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 定义处理步骤的类型
type ProcessStepStatus = 'pending' | 'running' | 'completed' | 'error';

interface ProcessStep {
  id: string;
  name: string;
  description: string;
  process: (item: DB.skuItem) => Promise<any>;
}

type StepResult = {
    stepId: string;
    stepName: string;
    result: any;
    success: boolean;
    message?: string;
}
// 处理结果类型
type ProcessResult = {
  item: DB.skuItem;
  stepResults: StepResult[];
};

// 定义状态
const State = {
  pendingItems: [] as DB.skuItem[],
  processSteps: [] as ProcessStep[],
  running: false,
  currentItemIndex: 0,
  currentStepIndex: 0,
  completedItems: [] as DB.skuItem[],
  processResults: [] as ProcessResult[],
  errorItems: [] as { item: DB.skuItem, error: string }[],
  paused: false,
}

export const skuProcessStore = createT<typeof State>()((set, get) => ({
  ...State,
  init: (pendingItems: DB.skuItem[], processSteps: ProcessStep[] = []) =>
    set({ pendingItems, processSteps, currentItemIndex: 0, currentStepIndex: 0, completedItems: [], processResults: [], errorItems: [], running: false, paused: false }),
  clear: () => set({ pendingItems: [], running: false, currentItemIndex: 0, currentStepIndex: 0, completedItems: [], processResults: [], errorItems: [], paused: false }),
  start: () => {
    const state = get();
    if (state.pendingItems.length === 0 || state.processSteps.length === 0) return;
    set({ running: true, paused: false });
    processNextStep();
  },
  pause: () => set({ paused: true }),
  resume: () => {
    set({ paused: false });
    processNextStep();
  },
  cancel: () => set({ running: false, paused: false }),
  skipCurrentItem: () => {
    const state = get();
    if (!state.running || state.pendingItems.length === 0) return;

    set({
      currentItemIndex: (state.currentItemIndex + 1) % state.pendingItems.length,
      currentStepIndex: 0
    });

    processNextStep();
  },
}));

// 处理下一个步骤的函数
async function processNextStep() {
  const state = skuProcessStore.getState();

  if (!state.running || state.paused || state.pendingItems.length === 0 || state.processSteps.length === 0) return;

  // 如果当前项目的所有步骤都已完成，移动到下一个项目
  if (state.currentStepIndex >= state.processSteps.length) {
    const completedItem = state.pendingItems[state.currentItemIndex];
    const newCompletedItems = [...state.completedItems, completedItem];

    // 如果所有项目都已处理完成
    if (state.currentItemIndex >= state.pendingItems.length - 1) {
      skuProcessStore.setState({
        running: false,
        completedItems: newCompletedItems,
        currentItemIndex: 0,
        currentStepIndex: 0
      });
      return;
    }

    // 移动到下一个项目
    skuProcessStore.setState({
      currentItemIndex: state.currentItemIndex + 1,
      currentStepIndex: 0,
      completedItems: newCompletedItems
    });

    // 继续处理
    setTimeout(processNextStep, 100);
    return;
  }

  const currentItem = state.pendingItems[state.currentItemIndex];
  const currentStep = state.processSteps[state.currentStepIndex];

  try {
    // 执行当前步骤的处理函数并保存结果
    const result = await currentStep.process(currentItem);

    // 查找或创建当前项目的处理结果
    let currentResult = state.processResults.find(r => r.item.itemsId === currentItem.itemsId);

    if (!currentResult) {
      currentResult = {
        item: currentItem,
        stepResults: []
      };
    }

    // 添加当前步骤的处理结果
    const stepResult = {
      stepId: currentStep.id,
      stepName: currentStep.name,
      result: result,
      success: true
    };

    // 更新处理结果
    const updatedResults = state.processResults.filter(r => r.item.itemsId !== currentItem.itemsId);
    updatedResults.push({
      ...currentResult,
      stepResults: [...currentResult.stepResults.filter(sr => sr.stepId !== currentStep.id), stepResult]
    });

    // 移动到下一个步骤
    skuProcessStore.setState({
      processResults: updatedResults,
      currentStepIndex: state.currentStepIndex + 1
    });

    // 继续处理
    setTimeout(processNextStep, 100);
  } catch (error) {
    // 获取错误信息
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 查找或创建当前项目的处理结果
    let currentResult = state.processResults.find(r => r.item.itemsId === currentItem.itemsId);

    if (!currentResult) {
      currentResult = {
        item: currentItem,
        stepResults: []
      };
    }

    // 添加当前步骤的错误结果
    const stepResult = {
      stepId: currentStep.id,
      stepName: currentStep.name,
      result: null,
      success: false,
      message: errorMessage
    };

    // 更新处理结果
    const updatedResults = state.processResults.filter(r => r.item.itemsId !== currentItem.itemsId);
    updatedResults.push({
      ...currentResult,
      stepResults: [...currentResult.stepResults.filter(sr => sr.stepId !== currentStep.id), stepResult]
    });

    // 处理错误
    skuProcessStore.setState({
      processResults: updatedResults,
      errorItems: [...state.errorItems, { item: currentItem, error: errorMessage }],
      running: false
    });
  }
}

// 进度条组件 - 支持多种状态显示
const ProgressBar = ({
  value,
  max,
  className,
  status = 'default'
}: {
  value: number,
  max: number,
  className?: string,
  status?: 'default' | 'success' | 'error' | 'warning' | 'processing'
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  // 根据状态确定颜色和动画效果
  const getColorClass = () => {
    switch (status) {
      case 'success':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      case 'warning':
        return 'bg-amber-500';
      case 'processing':
        return 'bg-blue-600 animate-pulse';
      default:
        return 'bg-blue-600';
    }
  };

  // 根据状态确定背景色
  const getBackgroundClass = () => {
    switch (status) {
      case 'success':
        return 'bg-green-100';
      case 'error':
        return 'bg-red-100';
      case 'warning':
        return 'bg-amber-100';
      case 'processing':
        return 'bg-blue-100';
      default:
        return 'bg-gray-200';
    }
  };

  // 根据状态确定额外的动画效果
  const getAnimationClass = () => {
    if (status === 'processing') {
      return 'after:absolute after:top-0 after:left-0 after:right-0 after:bottom-0 after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent after:animate-shimmer';
    }
    return '';
  };

  return (
    <div className={cn("w-full rounded-full h-2.5 relative overflow-hidden", getBackgroundClass(), className)}>
      <div
        className={cn(
          getColorClass(),
          getAnimationClass(),
          "h-2.5 rounded-full transition-all duration-300 ease-in-out relative"
        )}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

// 步骤指示器组件
const StepIndicator = ({
  steps,
  currentStep,
  className
}: {
  steps: ProcessStep[],
  currentStep: number,
  className?: string
}) => {
  return (
    <div className={cn("flex items-center space-x-2 w-full", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={step.id} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              {index > 0 && (
                <div
                  className={cn(
                    "h-1 flex-1",
                    isCompleted ? "bg-blue-600" : "bg-gray-300"
                  )}
                ></div>
              )}
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                  isActive ? "bg-blue-600 text-white" :
                    isCompleted ? "bg-green-500 text-white" :
                      "bg-gray-300 text-gray-700"
                )}
              >
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-1 flex-1",
                    index < currentStep ? "bg-blue-600" : "bg-gray-300"
                  )}
                ></div>
              )}
            </div>
            <span className={cn(
              "text-xs mt-1 text-center",
              isActive ? "text-blue-600 font-medium" :
                isCompleted ? "text-green-500" :
                  "text-gray-500"
            )}>
              {step.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// 处理结果组件
const ProcessResultItem = ({
  result,
  isPending,
  isProcessing,
  item,
  index,
  currentStepIndex,
  totalSteps,
  steps
}: {
  result?: ProcessResult,
  isPending?: boolean,
  isProcessing?: boolean,
  item?: DB.skuItem,
  index?: number,
  currentStepIndex?: number,
  totalSteps?: number,
  steps?: ProcessStep[]
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 如果是待处理项目，使用传入的item
  const displayItem = isPending || isProcessing ? item! : result!.item;

  // 获取分类名称
  function getCategoryName(category?: string) {
    if (!category) return '未分类';
    switch (category) {
      case '2312': return '手办';
      case '2331': return '周边';
      case '2066': return '模型';
      case '2273': return '数码';
      default: return '其他';
    }
  }

  // 获取分类图标
  function getCategoryIcon(category?: string) {
    if (!category) return <Info className="h-3.5 w-3.5" />;
    switch (category) {
      case '2312': // 手办
        return <Package className="h-3.5 w-3.5" />;
      case '2331': // 周边
        return <Tag className="h-3.5 w-3.5" />;
      case '2066': // 模型
        return <Package className="h-3.5 w-3.5" />;
      case '2273': // 数码
        return <Package className="h-3.5 w-3.5" />;
      default:
        return <Info className="h-3.5 w-3.5" />;
    }
  }

  // 获取分类样式
  function getCategoryStyle(category?: string) {
    if (!category) return { bgColor: 'bg-gray-100 text-gray-600' };
    switch (category) {
      case '2312': // 手办
        return { bgColor: 'bg-pink-100/40 text-pink-600' };
      case '2331': // 周边
        return { bgColor: 'bg-purple-100/40 text-purple-600' };
      case '2066': // 模型
        return { bgColor: 'bg-blue-100/40 text-blue-600' };
      case '2273': // 数码
        return { bgColor: 'bg-green-100/40 text-green-600' };
      default:
        return { bgColor: 'bg-gray-100/40 text-gray-600' };
    }
  }

  // 根据状态调整组件的显示样式
  const getStatusStyles = () => {
    if (isPending) {
      return {
        border: "border-blue-200",
        hover: "hover:bg-blue-50/30",
        badge: "bg-blue-100 text-blue-800 hover:bg-blue-100",
        badgeText: "待处理"
      };
    } else if (isProcessing) {
      return {
        border: "border-blue-300",
        hover: "hover:bg-blue-50/50",
        badge: "bg-blue-200 text-blue-800 hover:bg-blue-200 animate-pulse",
        badgeText: `处理中 ${currentStepIndex! + 1}/${totalSteps}`
      };
    } else if (result?.stepResults.every(sr => sr.success)) {
      return {
        border: "border-green-200",
        hover: "hover:bg-green-50/30",
        badge: "bg-green-100 text-green-800 hover:bg-green-100",
        badgeText: "处理完成"
      };
    } else {
      return {
        border: "border-amber-200",
        hover: "hover:bg-amber-50/30",
        badge: "bg-amber-100 text-amber-800 hover:bg-amber-100",
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
              {/* 商品图片 */}
              <div className="relative w-10 h-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                <img
                  src={`https:${displayItem.img}@72w_72h_85q.webp`}
                  alt={displayItem.name || `商品 #${displayItem.itemsId}`}
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>

              {/* 商品信息 */}
              <div className="flex-3 min-w-0 flex flex-col">
                <h4 className="text-sm font-medium text-left text-gray-900 truncate pr-1">
                  {displayItem.name || `商品 #${displayItem.itemsId}`}
                </h4>

                {/* 商品详情 */}
                <div className="flex items-center justify-start mt-0.5 space-x-2 text-[10px] text-gray-500">
                  {/* 分类标签 */}
                  {displayItem.category && (
                    <Badge variant="outline" className={`text-[8px] h-4 ${getCategoryStyle(displayItem.category).bgColor}`}>
                      {getCategoryName(displayItem.category)}
                    </Badge>
                  )}
                  {/* 价格信息 */}
                  {displayItem.marketPrice && (
                    <span className="text-[10px] font-medium text-blue-600">¥{displayItem.marketPrice / 100}</span>
                  )}

                  {displayItem.c2cItemsIds && displayItem.c2cItemsIds.length > 0 && (
                    <span>库存: {displayItem.c2cItemsIds.length}</span>
                  )}

                  <span>ID: {displayItem.itemsId}</span>
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
          {isPending && steps ? (
            <div className="p-3 pt-0 border-t border-gray-100">
              <div className="p-2 rounded-md bg-blue-50 text-blue-700 text-xs">
                <div className="flex items-center mb-2">
                  <Info className="w-4 h-4 mr-2" />
                  <span>此项目将按照以下步骤进行处理</span>
                </div>
                <div className="space-y-2 mt-2">
                  {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center p-1 hover:bg-blue-100/50 rounded-md transition-colors">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                        <span className="text-[10px] font-medium text-gray-700">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-medium">{step.name}</span>
                        {step.description && (
                          <p className="text-[10px] text-blue-600 mt-0.5">{step.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : isProcessing && steps ? (
            <div className="p-3 pt-0 border-t border-gray-100">
              <div className="space-y-2">
                {steps.map((step, idx) => {
                  const status = idx < currentStepIndex! ? 'completed' :
                    idx === currentStepIndex! ? 'running' : 'pending';

                  return (
                    <div key={step.id} className={cn(
                      "p-2 rounded-md transition-all duration-200",
                      status === 'completed' ? "bg-green-50" :
                        status === 'running' ? "bg-blue-50" :
                          "bg-gray-50"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center mr-2",
                            status === 'completed' ? "bg-green-100 text-green-600" :
                              status === 'running' ? "bg-blue-100 text-blue-600 animate-pulse" :
                                "bg-gray-200 text-gray-600"
                          )}>
                            {status === 'completed' ?
                              <CheckCircle className="w-3 h-3" /> :
                              status === 'running' ?
                                <span className="text-[10px] font-medium">{idx + 1}</span> :
                                <span className="text-[10px] font-medium">{idx + 1}</span>}
                          </div>
                          <span className="text-sm font-medium">{step.name}</span>
                        </div>
                        <Badge variant="outline" className={cn(
                          status === 'completed' ? "text-green-600" :
                            status === 'running' ? "text-blue-600 animate-pulse" :
                              "text-gray-500"
                        )}>
                          {status === 'completed' ? "已完成" :
                            status === 'running' ? "处理中" :
                              "待处理"}
                        </Badge>
                      </div>

                      {status === 'running' && (
                        <div className="mt-2 ml-7">
                          <ProgressBar value={50} max={100} status="processing" className="h-1.5" />
                          <p className="text-xs text-blue-600 mt-1">{step.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : result ? (
            <div className="p-3 pt-0 border-t border-gray-100">
              <div className="space-y-2">
                {result.stepResults.map(r => <StepResultItem stepResult={r} />)}
              </div>
            </div>
          ) : null}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

const StepResultItem = ({stepResult}:{stepResult:StepResult}) => {
  const [isStepOpen, setIsStepOpen] = useState(false);

  return (
    <Collapsible
      key={stepResult.stepId}
      open={isStepOpen}
      onOpenChange={setIsStepOpen}
      className={cn(
        "p-2 rounded-md transition-all duration-200",
        stepResult.success ? "bg-green-50" : "bg-red-50"
      )}
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center mr-2",
              stepResult.success ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            )}>
              {stepResult.success ?
                <CheckCircle className="w-3 h-3" /> :
                <AlertCircle className="w-3 h-3" />}
            </div>
            <span className="text-sm font-medium">{stepResult.stepName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={stepResult.success ? "text-green-600" : "text-red-600"}>
              {stepResult.success ? "成功" : "失败"}
            </Badge>
            <div className="text-gray-400">
              {isStepOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 ml-7 space-y-2">
          {/* 错误信息 */}
          {stepResult.message && (
            <div className="text-xs text-red-600 p-2 bg-red-50 rounded-md border border-red-200">
              <div className="font-medium mb-1">错误信息:</div>
              {stepResult.message}
            </div>
          )}

          {/* 处理结果 */}
          {stepResult.result && (
            <div className="text-xs">
              <div className="font-medium text-gray-700 mb-1">处理结果:</div>
              <div className="bg-white p-2 rounded-md border border-gray-200 overflow-auto max-h-[200px]">
                {typeof stepResult.result === 'object' ? (
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(stepResult.result, null, 2)}
                  </pre>
                ) : (
                  <span>{String(stepResult.result)}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// 移除 PendingItemPreview 组件，使用 ProcessResultItem 组件代替

// 主组件
export const skuProcessBoard = () => {
  const {
    pendingItems,
    processSteps,
    running,
    currentItemIndex,
    currentStepIndex,
    completedItems,
    processResults,
    errorItems,
    paused,
    clear,
    start,
    pause,
    resume,
    cancel,
    skipCurrentItem
  } = skuProcessStore();

  const [showPreview, setShowPreview] = useState(true);
  const [showResults, setShowResults] = useState(true);
  const [showPendingItems, setShowPendingItems] = useState(false);

  // 移除自动关闭预览的效果
  useEffect(() => {
    // 不再需要自动关闭预览
  }, [completedItems.length, pendingItems.length]);

  const totalItems = pendingItems.length;
  const totalSteps = processSteps.length;
  const currentItem = pendingItems[currentItemIndex];
  const currentStep = processSteps[currentStepIndex];

  const overallProgress = {
    completed: completedItems.length,
    total: totalItems,
    percentage: totalItems > 0 ? (completedItems.length / totalItems) * 100 : 0
  };

  const itemProgress = {
    completed: currentStepIndex,
    total: totalSteps,
    percentage: totalSteps > 0 ? (currentStepIndex / totalSteps) * 100 : 0
  };

  return (
    <ModalOverlay
      isOpen={pendingItems.length > 0}
      onClose={running ? () => { } : clear}
      contentClassName="w-full max-w-2xl p-0 rounded-lg overflow-hidden shadow-xl"
      alignment="center"
    >
      <Card className="border-0 shadow-none py-2 gap-2">
        <div className="border-b border-gray-100 px-3 py-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">SKU处理队列</span>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${running ? paused ? 'bg-amber-400' : 'bg-green-500 animate-pulse' : completedItems.length === totalItems ? 'bg-blue-500' : 'bg-gray-400'}`} />
              <span className="text-xs text-gray-500">
                {running
                  ? paused
                    ? "已暂停"
                    : "处理中"
                  : showPreview
                    ? "预览"
                    : completedItems.length === totalItems
                      ? "已完成"
                      : "待处理"}
              </span>
            </div>
          </div>
          {!running && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clear}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <CardContent className="p-4 space-y-4">
          {/* 总体进度与已处理项目合并 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                    处理进度
                  </h3>
                  <span className="text-xs text-gray-500">
                    {overallProgress.completed}/{overallProgress.total} 项目
                  </span>
                </div>
                <ProgressBar value={overallProgress.completed} max={overallProgress.total} />
              </div>
              {processResults.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs ml-2"
                  onClick={() => setShowResults(!showResults)}
                >
                  {showResults ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      收起
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      展开
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* 已处理项目结果 */}
            {processResults.length > 0 && showResults && (
              <div className="p-3 max-h-60 overflow-y-auto">
                {processResults.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">暂无已处理项目</p>
                ) : (
                  <div className="space-y-3">
                    {processResults.map((result) => (
                      <ProcessResultItem
                        key={result.item.itemsId}
                        result={result}
                        steps={processSteps}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 待处理项目预览 - 仅在非运行状态且非预览阶段下显示 */}
          {!running && !paused && pendingItems.length > 0 && !showPreview && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Package className="w-4 h-4 mr-1 text-blue-500" />
                  待处理项目 ({pendingItems.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowPendingItems(!showPendingItems)}
                >
                  {showPendingItems ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      收起
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      预览
                    </>
                  )}
                </Button>
              </div>

              {showPendingItems && (
                <div className="p-3 max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {pendingItems.slice(0, 6).map((item, index) => (
                      <ProcessResultItem
                        key={item.itemsId}
                        item={item}
                        isPending={true}
                        index={index}
                        steps={processSteps}
                      />
                    ))}
                  </div>
                  {pendingItems.length > 6 && (
                    <div className="text-xs text-center text-gray-500 mt-2">
                      还有 {pendingItems.length - 6} 个项目未显示
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 预览阶段显示所有待处理项目 */}
          {!running && !paused && pendingItems.length > 0 && showPreview && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Package className="w-4 h-4 mr-1 text-blue-500" />
                  待处理项目 ({pendingItems.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowPendingItems(!showPendingItems)}
                >
                  {showPendingItems ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      收起
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      展开
                    </>
                  )}
                </Button>
              </div>

              {showPendingItems && (
                <div className="p-3 max-h-60 overflow-y-auto">
                  <div className="space-y-3">
                    {pendingItems.map((item, index) => (
                      <ProcessResultItem
                        key={item.itemsId}
                        isPending={true}
                        item={item}
                        index={index}
                        steps={processSteps}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 步骤指示器与当前处理项目合并 */}
          {(showPreview || running) && processSteps.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 flex items-center justify-between">
                  <span className="flex items-center">
                    {running ? (
                      <>
                        <Play className="w-4 h-4 mr-1 text-blue-500" />
                        正在处理
                      </>
                    ) : (
                      <>
                        <Info className="w-4 h-4 mr-1 text-blue-500" />
                        处理步骤
                      </>
                    )}
                  </span>
                  {running && currentItem && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      步骤 {currentStepIndex + 1}/{totalSteps}
                    </span>
                  )}
                </h3>
              </div>

              <div className="p-3">
                {/* 步骤指示器 */}
                <StepIndicator
                  steps={processSteps}
                  currentStep={running ? currentStepIndex : 0}
                  className="mb-3"
                />

                {/* 当前处理项目信息 */}
                {running && currentItem && (
                  <div className="mt-3">
                    <ProcessResultItem
                      item={currentItem}
                      isProcessing={true}
                      currentStepIndex={currentStepIndex}
                      totalSteps={totalSteps}
                      steps={processSteps}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 错误信息 - 如果有错误则显示 */}
          {errorItems.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                处理过程中出现错误
              </h3>
              <div className="max-h-24 overflow-y-auto text-xs text-red-600">
                {errorItems.map((error, index) => (
                  <p key={index} className="mb-1">
                    {error.item.name || `SKU #${error.item.itemsId}`}: {error.error}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-gray-50 p-4 flex justify-between">
          {!running && !paused ? (
            <>
              <Button variant="outline" onClick={cancel}>
                取消
              </Button>
              <Button onClick={start} disabled={processSteps.length === 0}>
                <Play className="w-4 h-4 mr-2" />
                开始处理
              </Button>
            </>
          ) : paused ? (
            <>
              <Button variant="outline" onClick={cancel}>
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={skipCurrentItem}>
                  <SkipForward className="w-4 h-4 mr-2" />
                  跳过当前
                </Button>
                <Button onClick={resume}>
                  <Play className="w-4 h-4 mr-2" />
                  继续
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={cancel}>
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={skipCurrentItem}>
                  <SkipForward className="w-4 h-4 mr-2" />
                  跳过当前
                </Button>
                <Button onClick={pause}>
                  <Pause className="w-4 h-4 mr-2" />
                  暂停
                </Button>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </ModalOverlay>
  );
}
