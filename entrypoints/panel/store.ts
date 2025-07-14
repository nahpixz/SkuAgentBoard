// import { _create, setFn } from "@/lib/utils";
// import { useSettingsStore as useComponentSettingsStore } from "@/components/panel/settings-store";

// // 为了保持向后兼容性，我们从组件 settings-store 中获取状态
// // 这样可以确保两个 store 使用相同的状态
// const settingsState = {
//   autoCaptureMall: false,
//   autoCaptureDetail: false,
// }

// // 导出一个兼容旧版 API 的 store
// export const useSettingsStore = _create((set: setFn<typeof settingsState>) => {
//   // 初始化时同步组件 store 的状态
//   const componentStore = useComponentSettingsStore.getState();
//   if (componentStore.autoCaptureMall !== settingsState.autoCaptureMall) {
//     settingsState.autoCaptureMall = componentStore.autoCaptureMall;
//   }
  
//   return {
//     ...settingsState,
//     // 这些方法会同时更新两个 store
//     toggleAutoCaptureMall: () => {
//       const newValue = !useSettingsStore.getState().autoCaptureMall;
//       set({ autoCaptureMall: newValue });
//       useComponentSettingsStore.setState({ autoCaptureMall: newValue });
//     },
//     toggleAutoCaptureDetail: () => {
//       const newValue = !useSettingsStore.getState().autoCaptureDetail;
//       set({ autoCaptureDetail: newValue });
//       useComponentSettingsStore.setState({ autoCaptureDetail: newValue });
//     },
//   };
// });
// //-------------------------------------------------------------
// // type OPT_MODE = 'idle' | 'search' | 'select' 

// // const uxState = {
// //   mode: 'idle' as OPT_MODE,

// // }

// // export const useUxStore= _create((set:setFn<typeof uxState>) => ({
// //   ...uxState,
// // }));
// //-------------------------------------------------------------





