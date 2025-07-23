import { ModalOverlay } from "@/components/panel/modal-overlay"
import { DB } from "@/entrypoints/panel/db";
import { createT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter} from "@/components/ui/card";
import { Play, Pause, X, SkipForward, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { JSX, useMemo, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { C2C_LIST } from "@/entrypoints/panel/api";
import "./skuProcessBoard.css";
import { Pipe, ProcessStep } from "../pipe/index";

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
  processSteps: [] as ProcessStep<DB.skuItem>[],
  running: false,
  currentItemIndex: -1,
  currentStepIndex: 0,
  processResults: [] as ProcessResult[],
  paused: false,
}

export const skuProcessStore = createT<typeof State>({dev:true})((set, get) => ({
  ...State,
  init: <R,>(pendingItems: DB.skuItem[], pipe: Pipe<DB.skuItem,R>) =>
    set({ pendingItems, 
      processSteps:pipe.steps, 
      processResults:pendingItems.map(item => ({
        item,
        stepResults: []
      })),
      currentItemIndex: -1, currentStepIndex: 0, 
      running: false, paused: false
    }),
  clear: () => set({ pendingItems: [], running: false, currentItemIndex: -1, currentStepIndex: 0, processResults: [], paused: false }),
  start: () => {
    const state = get();
    if (state.pendingItems.length === 0 || state.processSteps.length === 0) return;
    set({ running: true, paused: false,currentItemIndex: 0,currentStepIndex: 0 });
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
  const {running,paused,processSteps,currentItemIndex,currentStepIndex,
    processResults:[...updatedResults]
  } = skuProcessStore.getState();

  if (!running || paused || updatedResults.length === 0 || processSteps.length === 0) return;

  // 如果当前项目的所有步骤都已完成，移动到下一个项目
  if (currentStepIndex >= processSteps.length) {
    // 如果所有项目都已处理完成
    if (currentItemIndex >= updatedResults.length - 1) {
      skuProcessStore.setState({
        running: false,
        currentItemIndex: currentItemIndex + 1,
        currentStepIndex: 0
      });
      return;
    }

    // 移动到下一个项目
    skuProcessStore.setState({
      currentItemIndex: currentItemIndex + 1,
      currentStepIndex: 0,
    });

    // 继续处理
    setTimeout(processNextStep, 100);
    return;
  }

  const {item,stepResults:[...updatedStepResults]} = updatedResults[currentItemIndex];
  const currentStep = processSteps[currentStepIndex];

  async function tryStep(){
    try {
      const prev = updatedStepResults.at(-1)?.result
      return [await currentStep.process(item,prev),null]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return [null,errorMessage]
    }
  }
  const [result,error] = await tryStep();
  const success = !error;

  updatedStepResults.push({
        stepId: currentStep.id,
        stepName: currentStep.name,
        result: result,
        success,
        message: error
    })
      
    updatedResults[currentItemIndex] = {item,
      stepResults:updatedStepResults,
    };
    
    // 移动到下一个步骤
    skuProcessStore.setState(success?{
      processResults: updatedResults,
      currentStepIndex: currentStepIndex + 1
    }:{
      processResults: updatedResults,
      paused:true,
    });

    // 继续处理
    setTimeout(processNextStep, 100);
}

// 进度条组件 - 支持多种状态显示
const ProgressBar = ({
  className,
  status = 'default'
}: {
  className?: string,
  status?: 'default' | 'success' | 'error' | 'warning' | 'processing'
}) => {
  const currentItemIndex = skuProcessStore(state=>state.currentItemIndex);
  const currentStepIndex = skuProcessStore(state=>state.currentStepIndex);
  const totalItem = skuProcessStore(state=>state.pendingItems.length);
  const totalSteps = skuProcessStore(state=>state.processSteps.length);
  const curItemIdx = currentItemIndex<0?0:currentItemIndex;
  const max = totalSteps*totalItem;
  const cur = currentStepIndex + curItemIdx*totalSteps;
  
  const percentage = max > 0 ? (cur / max) * 100 : 0;

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

// 获取分类样式
function getCategoryStyle(category?: C2C_LIST.CategoryType) {
  if (!category) return { bgColor: 'bg-gray-100 text-gray-600' };
  switch (category) {
    case C2C_LIST.CategoryType.Figure: // 手办
      return { bgColor: 'bg-pink-100/40 text-pink-600' };
    case C2C_LIST.CategoryType.Goods: // 周边
      return { bgColor: 'bg-purple-100/40 text-purple-600' };
    case C2C_LIST.CategoryType.Model: // 模型 
      return { bgColor: 'bg-blue-100/40 text-blue-600' };
    case C2C_LIST.CategoryType._3C: // 数码
      return { bgColor: 'bg-green-100/40 text-green-600' };
    default:
      return { bgColor: 'bg-gray-100/40 text-gray-600' };
  }
}

// 处理结果组件
const ProcessResultItem = ({
  result,
  index,
}: {
  result?: ProcessResult,
  index: number,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const running = skuProcessStore(state=>state.running);
  const paused = skuProcessStore(state=>state.paused);
  const currentItemIndex = skuProcessStore(state=>state.currentItemIndex); //memo会失效，currentItemIndex变化刷新所有组件
  const currentStepIndex = skuProcessStore(state=>state.currentStepIndex); //memo会失效
  const steps = skuProcessStore(state=>state.processSteps);

  const isPending = index > currentItemIndex && !(result?.stepResults?.length);
  // 即使在暂停状态下，当前项目仍然被视为"处理中"
  const isProcessing = (running || paused) && currentItemIndex === index;
  const lastResultStepId = result?.stepResults.at(-1)?.stepId;
  const thsItemStepIdx = isPending? 0
                        :isProcessing ? currentStepIndex
                        :lastResultStepId ? Math.min(steps.findIndex(s=>s.id == lastResultStepId) + 1,steps.length)
                        :steps.length;
  const hasError = result?.stepResults.some(sr => sr.message);
  

  // const isOpen = _isOpen && isPending;
  
  // 如果是待处理项目，使用传入的item
  const displayItem =  result!.item;

  // 根据状态调整组件的显示样式
  const getStatusStyles = () => {
    const paused = skuProcessStore(state=>state.paused);
    
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
        badgeText: `处理中` //${Math.min(currentStepIndex! + 1,totalSteps)}/${totalSteps}
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
                      {C2C_LIST.getCategoryName(displayItem.category)}
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
          <div className="p-3 pt-0 border-t border-gray-100">
            <div className="space-y-2">
              {/* 已执行步骤显示结果 */}
              {result?.stepResults?.map((stepResult,idx) => (
                <StepResultItem 
                  key={stepResult.success?stepResult.stepId:`${stepResult.stepId}_ERR_${idx}`}
                  stepResult={stepResult}
                  status="completed"
                />
              ))}
              
              {/* 未执行步骤以待处理状态显示 */}
              {steps && (thsItemStepIdx < steps.length)&& 
                steps.slice(thsItemStepIdx).map((step, idx) => {
                  const actualIdx = thsItemStepIdx + idx;
                  const status = isProcessing && actualIdx === currentStepIndex ? 'running' : 'pending';
                  return (
                    <StepResultItem 
                      key={step.id}
                      step={step}
                      status={status}
                      index={actualIdx}
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

// 统一的步骤显示组件，可以处理不同状态的步骤（已完成、进行中、待处理、暂停、错误）
const StepResultItem = ({
  step, // 步骤信息
  status, // 步骤状态：'completed', 'running', 'pending', 'error'
  stepResult, // 步骤结果（如果有）
  index, // 步骤索引
}: {
  step?: ProcessStep<DB.skuItem>;
  status: 'completed' | 'running' | 'pending' | 'error';
  stepResult?: StepResult;
  index?: number;
}) => {
  const [isStepOpen, setIsStepOpen] = useState(false);
  const paused = skuProcessStore(state=>state.paused);
    // 根据stepResult找到对应的ProcessStep来获取render函数
  const processSteps = skuProcessStore(state=>state.processSteps);
  const currentStep = stepResult && processSteps.find(s => s.id === stepResult.stepId);
  const stepRender = currentStep?.render;
  
  // 确定显示内容
  const stepName = stepResult?.stepName || step?.name || '';
  const stepDescription = step?.description || '';
  const isSuccess = stepResult?.success ?? (status === 'completed');
  
  // 确定样式
  const bgColor = status === 'error' ? "bg-red-50" :
                 status === 'completed' ? (isSuccess ? "bg-green-50" : "bg-red-50") :
                 status === 'running' ? (paused ? "bg-amber-50" : "bg-blue-50") : "bg-gray-50";
  
  const iconBgColor = status === 'error' ? "bg-red-100 text-red-600" :
                     status === 'completed' ? (isSuccess ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600") :
                     status === 'running' ? (paused ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600 animate-pulse") : "bg-gray-200 text-gray-600";
  
  const badgeColor = status === 'error' ? "text-red-600" :
                    status === 'completed' ? (isSuccess ? "text-green-600" : "text-red-600") :
                    status === 'running' ? (paused ? "text-amber-600" : "text-blue-600 animate-pulse") : "text-gray-500";
  
  const badgeText = status === 'error' ? "错误" :
                   status === 'completed' ? (isSuccess ? "成功" : "失败") :
                   status === 'running' ? (paused ? "已暂停" : "处理中") : "待处理";

  return (
    <Collapsible
      open={isStepOpen}
      onOpenChange={setIsStepOpen}
      className={cn(
        "p-2 rounded-md transition-all duration-200",
        bgColor
      )}
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center mr-2",
              iconBgColor
            )}>
              {status === 'completed' && isSuccess ?
                <CheckCircle className="w-3 h-3" /> :
                status === 'completed' && !isSuccess ?
                <AlertCircle className="w-3 h-3" /> :
                <span className="text-[10px] font-medium">{index !== undefined ? index + 1 : ''}</span>}
            </div>
            <div>
              <span className="text-sm font-medium">{stepName}</span>
              {stepDescription && status !== 'completed' && (
                <span className="text-xs ml-4 text-gray-500">{stepDescription}</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={badgeColor}>
              {badgeText}
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
          {stepResult?.message && (
            <div className="text-xs text-red-600 p-2 bg-red-50 rounded-md border border-red-200">
              <div className="font-medium mb-1">错误信息: {stepResult.message}</div>
            </div>
          )}

          {/* 处理结果 */}
          {stepResult?.result && (
            <div className="text-xs">
              <div className="font-medium text-gray-700 mb-1">处理结果:</div>
              <div className={`bg-white p-2 rounded-md border border-gray-200 overflow-auto max-h-fit`}>
                {stepRender ? (
                  stepRender(stepResult.result)
                ) : typeof stepResult.result === 'object' ? (
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(stepResult.result, null, 2)}
                  </pre>
                ) : (
                  <span>{String(stepResult.result)}</span>
                )}
              </div>
            </div>
          )}
          
          {/* 待处理步骤的详细说明 */}
          {status === 'pending' && step?.description && (
            <div className="text-xs text-left text-gray-600 p-2 bg-gray-50 rounded-md border border-gray-200">
              {/* <div className="font-medium mb-1">步骤说明:</div> */}
              {step.process.toString()}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}


// 主组件
export const SkuProcessBoard = () => {
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
  } = skuProcessStore();

  const [showResults, setShowResults] = useState(false);

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
                    <h1 className="font-bold text-lg text-gray-700">SKU处理队列</h1>
                    <span className="text-xs text-gray-500">
                      {running
                        ? hasError 
                          ?'出错'
                          : paused
                            ? "已暂停"
                            : "处理中"
                        : completedCot === totalItems
                          ? "已完成"
                          : "预览"}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {completedCot}/{totalItems} 项目
                </span>
              </div>
              <ProgressBar/>
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
        </div>

        <CardContent className="p-0">

            {/* 已处理项目结果 */}
            {processResults.length > 0 && showResults && (
              <div className={`mt-0 mb-3 p-3  overflow-y-auto custom-scrollbar max-h-90`}>
                {processResults.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">暂无已处理项目</p>
                ) : (
                  <div className="space-y-3">
                    {processResults.map((result,idx) => (
                      <ProcessResultItem
                        key={result.item.itemsId}
                        result={result}
                        index={idx}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

          {/* 步骤指示器与当前处理项目合并 */}
          {(
              <div className="p-0">
              {/* 预览状态 */}
              {!running && completedCot < totalItems && (
                <div className="p-2 border-t border-gray-100">
                  <div className="p-1 bg-blue-50/88 rounded-md text-blue-700 text-xs">
                    <div className="flex items-center mb-2">
                      <Info className="w-4 h-4 mr-2" />
                      <span>此项目将按照以下步骤进行处理</span>
                    </div>
                    <div className="space-y-2 mt-2">
                      {processSteps.map((step, idx) => (
                        <StepResultItem
                          key={step.id}
                          step={step}
                          status="pending"
                          index={idx}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

                {/* 当前处理项目信息 - 现代化水平布局 */}
                {running && (
                  <div className="bg-gradient-to-b from-white to-gray-50 shadow-sm overflow-hidden transition-all duration-300">
                    <div className="flex flex-col md:flex-row">
                      {/* 左侧：商品信息和图片 */}
                      <div className="w-full md:w-1/3 py-2 px-2 md:border-r border-b md:border-b-0 border-gray-100 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                        {/* 商品图片 - 突出显示 */}
                        <div className={cn(
                          "relative w-32 h-32 mb-3 rounded-lg overflow-hidden shadow-md ring-2 ring-offset-2 transition-all duration-300",
                          hasError? "ring-red-200 shadow-red-100" :
                          paused ? "ring-amber-100" : "ring-blue-100 running-item-image"
                        )}>
                          {hasError && <div className="absolute inset-0 bg-red-500/10 z-10 animate-pulse"></div>}
                          <img
                            src={`https:${currentProcessResult.item.img}@180w_180h_90q.webp`}
                            alt={currentProcessResult.item.name || `商品 #${currentProcessResult.item.itemsId}`}
                            className="w-full h-full object-contain bg-white"
                          />
                        </div>
                        
                        {/* 商品基本信息 */}
                        <h4 className="text-sm font-medium text-center text-gray-900 line-clamp-2 mb-1">
                          {currentProcessResult.item.name || `商品 #${currentProcessResult.item.itemsId}`}
                        </h4>
                        
                        <div className="flex items-center justify-center space-x-2 text-xs">
                          {currentProcessResult.item.category && (
                            <Badge variant="outline" className={`${getCategoryStyle(currentProcessResult.item.category).bgColor}`}>
                              {C2C_LIST.getCategoryName(currentProcessResult.item.category)}
                            </Badge>
                          )}
                          {currentProcessResult.item.marketPrice && (
                            <span className="font-medium text-blue-600">¥{currentProcessResult.item.marketPrice / 100}</span>
                          )}
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          <span>ID: {currentProcessResult.item.itemsId}</span>
                          {currentProcessResult.item.c2cItemsIds && (
                            <span className="ml-2">库存: {currentProcessResult.item.c2cItemsIds.length}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* 右侧：处理结果/待处理列表 */}
                      <div className={cn(
                        "w-full md:w-2/3 p-3 pr-0 transition-colors duration-300",
                        hasError ? "bg-red-50/38" : 
                        paused ? "bg-amber-50/38" : 
                        "bg-white"
                      )}>
                        <div className="flex items-center justify-between mb-3 mr-3">
                          <h3 className="text-sm font-semibold flex items-center">
                            {hasError ? (
                              <>
                                <AlertCircle className="w-4 h-4 mr-1.5 text-red-500" />
                                <span className="text-red-600">处理出错</span>
                              </>
                            ) : paused ? (
                              <>
                                <Pause className="w-4 h-4 mr-1.5 text-amber-500" />
                                <span className="text-amber-600">已暂停</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-1.5 text-blue-500 animate-pulse" />
                                <span className="text-blue-600">正在处理</span>
                              </>
                            )}
                            
                          </h3>
                          <span className={cn(
                            "text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors duration-200",
                            hasError ? "bg-red-100 text-red-800" : 
                            paused ? "bg-amber-100 text-amber-800" : 
                            "bg-blue-100 text-blue-800 animate-pulse"
                          )}>
                            {currentStepIndex}/{totalSteps} 步骤 
                          </span>
                        </div>
                        
                        <div className={
                          `bg-blue-50/20 space-y-2 max-h-fit overflow-y-auto pr-2 custom-scrollbar rounded-md transition-all duration-300`
                          // hasError ? "bg-red-50/50" : 
                        }>
                          {/* 已执行步骤显示结果 */}
                          {currentProcessResult.stepResults.map(stepResult => (
                            <StepResultItem 
                              key={stepResult.stepId}
                              stepResult={stepResult}
                              status="completed"
                            />
                          ))}
                          
                          {/* 未执行步骤以待处理状态显示 */}
                          {processSteps && currentStepIndex < processSteps.length && 
                            processSteps.slice(currentStepIndex).map((step, idx) => {
                              const actualIdx = currentStepIndex + idx;
                              const status = actualIdx === currentStepIndex ? 'running' : 'pending';
                              
                              return (
                                <StepResultItem 
                                  key={step.id}
                                  step={step}
                                  status={status}
                                  index={actualIdx}
                                />
                              );
                            })
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
        </CardContent>

        <CardFooter className="bg-gray-50 p-4 is flex justify-between [.border-t]:pt-3 border-t border-gray-50">
          {!running && !paused ? (
            <>
              <Button variant="outline" onClick={cancel}>
                取消
              </Button>
              <Button onClick={start} disabled={processSteps.length === 0 || completedCot === totalItems}>
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
