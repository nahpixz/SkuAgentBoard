import { createT, getFn, setFn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "motion/react";
import { Play, Square, RotateCcw, X, Settings, Database, Clock, TrendingUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { DB } from "@/entrypoints/panel/db";
import { skuAutoScroll } from "../agent";

const skuAgentState = {
  running: false,
  newSkuCount: 0,
  startTime: null as Date | null,
  startTimeRecent: null as Date | null,
  accumulatedTime: 0, // 累计运行时间（毫秒）
  initialStorageSize: 0,
  currentStorageSize: 0,
  freezeView: false,
  STORAGE_SIZE_QUERY_INTERVAL: 30,
}

export const skuAgentStore = createT<typeof skuAgentState>()((set,get) => ({
  ...skuAgentState,
  stepCount: (stepNew: number) => set(state => ({ newSkuCount: state.newSkuCount + stepNew })),
  setFreezeView: (freeze: boolean) => set({ freezeView: freeze }),
  reset: async() => {
    const sSize = await fetchStorageSize();
    set({ newSkuCount: 0, startTime: null, startTimeRecent: null, accumulatedTime: 0, running: false, initialStorageSize: sSize, currentStorageSize: sSize })
  },
  updateStorageSize:async () => {
    const sSize = await fetchStorageSize();
    set({ currentStorageSize: sSize });
  },
  handleStart: async () => {
    const state = get();
    const startMs = new Date();

    set({
      running: true,
      startTimeRecent: startMs,
      // 如果没有startTime（首次启动或重置后），设置startTime
      startTime: state.startTime || startMs
    });
    // return null;
    return skuAutoScroll();
    return new Promise((resolve, reject)=>{
      // const ivt = setInterval(()=>{
      //   // set(state => ({ newSkuCount: state.newSkuCount+10 }))
      // }, 666)
      
      setTimeout(()=>{
        // clearInterval(ivt);
        // const sessionTime = new Date().getTime() - state.startTimeRecent!.getTime();
        const sessionTime = new Date().getTime() - startMs.getTime();
        set({ running: false, accumulatedTime: state.accumulatedTime + sessionTime, startTimeRecent: null });
        resolve(0);
      },5000)
    })
  },
  handleStop: () => {
    const state = get();
    const sessionTime = new Date().getTime() - state.startTimeRecent!.getTime();
    set({ running: false, accumulatedTime: state.accumulatedTime + sessionTime, startTimeRecent: null });
  },
}));

const fetchStorageSize = async () => {
  const est:StorageEstimate&{usageDetails?:{indexedDB:number}} =  await navigator.storage.estimate();
  return est?.usageDetails?.indexedDB || est.usage 
}

// 格式化存储大小
const formatStorageSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化运行时间
const formatRuntime = (accumulatedTime: number, startTimeRecent: Date | null): string => {
  let totalTime = accumulatedTime;
  
  // 如果当前正在运行，加上本次运行时间
  if (startTimeRecent) {
    const currentSessionTime = new Date().getTime() - startTimeRecent.getTime();
    totalTime += currentSessionTime;
  }
  
  if (totalTime === 0) return '00:00:00';
  
  const hours = Math.floor(totalTime / (1000 * 60 * 60));
  const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalTime % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// 动画数字组件
const AnimatedNumber = ({ value, label, icon: Icon, color = "text-blue-500" }: {
  value: number;
  label: string;
  icon: any;
  color?: string;
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      const startValue = prevValueRef.current;
      const endValue = value;
      const duration = 500;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(startValue + (endValue - startValue) * progress);
        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
      prevValueRef.current = value;
    }
  }, [value]);

  return (
    <motion.div
      className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-left"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Icon className={`w-6 h-6 ${color}`} />
      <div>
        <motion.div
          key={displayValue}
          className="text-2xl font-bold"
          initial={{ scale: 1.2 ,color: "#3b82f6"}}
          animate={{ scale: 1, color: "#000" }}
          transition={{ duration: 0.3 }}
        >
          {displayValue.toLocaleString()}
        </motion.div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </motion.div>
  );
};

export const SkuAgentBoard = ({ className }: { className?: string }) => {
  const {
    running,
    newSkuCount,
    // totalSkuCount,
    startTime,
    startTimeRecent,
    accumulatedTime,
    initialStorageSize,
    currentStorageSize,
    freezeView,
    handleStop,
    setFreezeView,
    reset,
    handleStart,
    updateStorageSize,
    STORAGE_SIZE_QUERY_INTERVAL
  } = skuAgentStore();

  const [runtime, setRuntime] = useState('00:00:00');
  const [showSettings, setShowSettings] = useState(false);
  const totalSkuCount = useLiveQuery(DB.countSku) || 0;
  useEffect(()=>{reset()},[])
  // 更新运行时间
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (running && startTimeRecent) {
      let intervalCot = 0;
      interval = setInterval(() => {
        setRuntime(formatRuntime(accumulatedTime, startTimeRecent));
        (++intervalCot) % STORAGE_SIZE_QUERY_INTERVAL === 0 && updateStorageSize();
      }, 1000);
      // 立即更新一次
      setRuntime(formatRuntime(accumulatedTime, startTimeRecent));
    } 
    return () => clearInterval(interval);
  }, [running]);


  const handleReset = () => {
    reset();
    setRuntime('00:00:00');
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            SKU 采集代理
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            {/* <Button variant="ghost" size="icon">
              <X className="w-4 h-4" />
            </Button> */}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 设置选项 */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="freeze-view"
                  checked={freezeView}
                  onCheckedChange={(checked) => setFreezeView(!!checked)}
                />
                <label htmlFor="freeze-view" className="text-sm font-medium">
                  冻结视图
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 控制按钮 */}
        <div className="flex items-center gap-3">
          {!running ? (
            <Button onClick={handleStart} className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              开始
            </Button>
          ) : (
            <Button onClick={handleStop} variant="destructive" className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              停止
            </Button>
          )}
          <Button disabled={running} onClick={handleReset} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            重置
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <div className={`w-2 h-2 rounded-full ${running ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-500">
              {running ? '运行中' : '已停止'}
            </span>
          </div>
        </div>

        {/* 数据指示器 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedNumber
            value={newSkuCount}
            label="新获取 SKU (包含重复)"
            icon={TrendingUp}
            color="text-green-500"
          />
          <AnimatedNumber
            value={totalSkuCount}
            label="总 SKU 数"
            icon={Database}
            color="text-blue-500"
          />
        </div>

        {/* 时间信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Clock className="w-6 h-6 text-purple-500" />
            <div>
              <div className="text-lg font-mono">{runtime}</div>
              <div className="text-sm text-gray-500">运行时间</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Clock className="w-6 h-6 text-orange-500" />
            <div>
              <div className="text-lg">
                {startTime ? startTime.toLocaleTimeString() : '--:--:--'}
              </div>
              <div className="text-sm text-gray-500">开始时间</div>
            </div>
          </div>
        </div>

        {/* 存储占用 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Database className="w-6 h-6 text-indigo-500" />
            <div>
              <div className="text-lg font-mono">{formatStorageSize(currentStorageSize)}</div>
              <div className="text-sm text-gray-500">当前存储占用</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Database className="w-6 h-6 text-gray-500" />
            <div>
              <div className="text-lg font-mono">{formatStorageSize(initialStorageSize)}</div>
              <div className="text-sm text-gray-500">开始前存储占用</div>
            </div>
          </div>
        </div>

        {/* 存储增长指示器 */}
        {currentStorageSize > initialStorageSize && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="font-medium">存储增长</span>
              <span className="text-green-600 font-mono">
                +{formatStorageSize(currentStorageSize - initialStorageSize)}
              </span>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};