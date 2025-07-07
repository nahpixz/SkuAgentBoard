import { create as _create, StoreApi} from "zustand";
type setFn<T> =  StoreApi<T>['setState']
function create<T>(initializer:(set:any) => T) {
    return _create(initializer);
}

const settingsState = {
  autoCaptureMall: false,
  autoCaptureDetail:false,
}
export const useSettingsStore= create((set:setFn<typeof settingsState>) => ({
  ...settingsState,
  toggleAutoCaptureMall: () => set((state) => ({ autoCaptureMall: !state.autoCaptureMall })),
  toggleAutoCaptureDetail: () => set((state) => ({ autoCaptureDetail: !state.autoCaptureDetail })),
}));







