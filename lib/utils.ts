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

export function injectScript(file_path:string) {
    var node = document.getElementsByTagName('body')[0];
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', file_path);
    node.appendChild(script);
}