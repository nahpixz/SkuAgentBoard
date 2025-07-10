import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { create, StoreApi} from "zustand";
export type setFn<T> =  StoreApi<T>['setState']
export function _create<T>(initializer:(set:any) => T) {
    return create(initializer);
}