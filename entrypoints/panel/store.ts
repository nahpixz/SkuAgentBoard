import { _create,setFn } from "@/lib/utils";

const settingsState = {
  autoCaptureMall: false,
  autoCaptureDetail:false,
}
export const useSettingsStore= _create((set:setFn<typeof settingsState>) => ({
  ...settingsState,
  toggleAutoCaptureMall: () => set(state => ({ autoCaptureMall: !state.autoCaptureMall })),
  toggleAutoCaptureDetail: () => set(state => ({ autoCaptureDetail: !state.autoCaptureDetail })),
}));







