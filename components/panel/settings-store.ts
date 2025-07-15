import { createT, setFn } from "@/lib/utils";


const SettingsState = {
  autoCaptureMall: false,
  autoCaptureDetail: false,
  enableLiveQuery: true,
};

export const useSettingsStore = createT<typeof SettingsState>()((set,get) => ({
  ...SettingsState,
  
  // 打开设置模态框
  // openSettings: () => set({ isOpen: true }),
  
  // // 关闭设置模态框
  // closeSettings: () => set({ isOpen: false }),
  
  // // 切换设置模态框状态
  // toggleSettingsModal: () => set((state) => ({ isOpen: !state.isOpen })),

  getAndOpen_AutoCaptureMall:()=> {
    const autoCaptureMall = get().autoCaptureMall
    set({autoCaptureMall: true})
    return autoCaptureMall
  },
  
  // 切换自动抓取市集设置
  toggleAutoCaptureMall: () => set((state) => ({ autoCaptureMall: !state.autoCaptureMall })),
  
  // 切换自动抓取详情设置
  toggleAutoCaptureDetail: () => set((state) => ({ autoCaptureDetail: !state.autoCaptureDetail })),
  
  // 切换实时查询开关
  toggleLiveQuery: () => set((state) => ({ enableLiveQuery: !state.enableLiveQuery })),
}));