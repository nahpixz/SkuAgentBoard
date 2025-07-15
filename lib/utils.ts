import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { create, StoreApi} from "zustand";
export type setFn<T> =  StoreApi<T>['setState']
export type getFn<T> =  StoreApi<T>['getState']

//_create<T,R>(initializer: (set: setFn<T>) => R): UseBoundStore<StoreApi<R>> 不可行，泛型必须同时指定/同时不指定
export function _create<R>(initializer: (set: any) => R) {
  return create(initializer);
}

// //通过柯里化封装泛型, 同时实现：指定T + R自动推断，但不能用于重载
export const createT = <T>() =>
  <R>(initer: (set: setFn<T>,get:getFn<T>) => R) => {
    const _initer = initer as (set: any, get:any) => R //zustand 会从T推断R，会导致冲突
    return create(_initer);
  }

export function injectScript(file_path:string) {
    var node = document.getElementsByTagName('body')[0];
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', file_path);
    node.appendChild(script);
}