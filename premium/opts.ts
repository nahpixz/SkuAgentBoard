
export async function ScrollToEnd_bilimall() {
  return new Promise((resolve, reject) => {
    browser.devtools.inspectedWindow.eval(
      `(async()=>{
        const sElem = $('.scroll-view-container');
        const offset = Math.floor(Math.random() * (666 - 111)) + 111;
        const toY = sElem.scrollHeight - offset;
        const duration = 2000 + Math.random() * 3000;
        const startY = sElem.scrollTop;
        const segments = 2 + Math.floor(Math.random() * 4); 
        const segmentDistance = Math.floor((toY - startY) / segments);
        console.log(startY,toY)
        
        for (let i = 0; i < segments; i++) {
          const segmentDuration = duration / segments * (0.8 + Math.random() * 0.4); // 随机化每段时长
          console.log(sElem.scrollTop,startY + segmentDistance * (i + 1))
          sElem.scrollTo({top: startY + segmentDistance * (i + 1), behavior: 'smooth'});
          const pauseTime = 100 + Math.random() * 300;
          await new Promise(resolve => setTimeout(resolve, segmentDuration + pauseTime));
        }
      })()
      `,
      (result, e) => {
        if (e) {
          console.error("BiliMallScrollToEnd:", e)
          reject(e)
        }
        resolve(result)
      }
    );
  })
}


/**
 * 对指定的HTML节点进行截图
 * @param selector 传递给document.querySelector的选择器字符串
 * @returns 返回截图的Blob对象
 */
export async function captureElementScreenshot(selector: string): Promise<Base64URLString> {
  // 定义元素位置和尺寸的接口
  interface ElementRect {
    x: number;
    y: number;
    width: number;
    height: number;
    devicePixelRatio: number;
  }

  return new Promise((resolve, reject) => {
    const tabId = browser.devtools.inspectedWindow.tabId;
    
    // 连接到调试器
    browser.debugger.attach({ tabId }, "1.3", async () => {

      await new Promise( (resolve,reject)=>setTimeout(resolve, 3000));
      try {
        // 使用eval获取元素的位置和尺寸信息
        browser.devtools.inspectedWindow.eval(
          `(function() {
            const element = document.querySelector('${selector}');
            if (!element) return null;
            const rect = element.getBoundingClientRect();
            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              devicePixelRatio: window.devicePixelRati
            };
          })()`,
          async (result: ElementRect | null, error) => {
            if (error || !result) {
              browser.debugger.detach({ tabId });
              reject(error || new Error(`Element not found: ${selector}`));
              return;
            }
            console.log('result',result)

            await browser.debugger.sendCommand(
              { tabId},
              "Emulation.setDeviceMetricsOverride",
              {
                width: 430,
                height: 932,
                deviceScaleFactor: 3, // 强制 DPR=3
                mobile: true
              }
            );

            await new Promise( (resolve,reject)=>setTimeout(resolve, 3000));
            try {
              // 捕获屏幕截图
              const captureResult = await browser.debugger.sendCommand(
                { tabId },
                "Page.captureScreenshot",
                {
                  format: "png",
                  // clip: {
                  //   x: result.x * result.devicePixelRatio,
                  //   y: result.y * result.devicePixelRatio,
                  //   width: result.width * result.devicePixelRatio,
                  //   height: result.height * result.devicePixelRatio,
                  //   scale: 1
                  // }
                }
              ) as { data: string };
              
              // 确保captureResult存在并且有data属性
              if (!captureResult || typeof captureResult.data !== 'string') {
                throw new Error('截图失败：未获取到有效的图像数据');
              }
              
              const screenshot = `data:image/png;base64,${captureResult.data}`
              console.log('screenshot',screenshot)
              
              resolve(screenshot);
            } catch (err) {
              reject(err);
            } finally {
              // 断开调试器连接
              setTimeout(() => {
                browser.debugger.detach({ tabId });
              }, 5000);
            }
          }
        );
      } catch (err) {
        browser.debugger.detach({ tabId });
        reject(err);
      }
    });
  });
}

/**
 * 使用browser.tabs.captureVisibleTab对当前可见标签页进行截图
 * @param format 可选，指定截图的格式，默认为'png'
 * @param quality 可选，当format为'jpeg'时，指定图片质量，取值范围0-100
 * @returns 返回base64编码的图片数据URL
 */
export async function captureVisibleTab(format: 'jpeg' | 'png' = 'png', quality?: number): Promise<Base64URLString> {
  const tab = await browser.tabs.get(browser.devtools.inspectedWindow.tabId);
  return new Promise((resolve, reject) => {
    // 准备截图选项
    const options: Browser.extensionTypes.ImageDetails = { format };
    if (format === 'jpeg' && quality !== undefined) {
      options.quality = quality;
    }
    
    // 使用browser.tabs API捕获当前可见标签页
    browser.tabs.captureVisibleTab(tab.windowId,options, (dataUrl) => {
      // if (browser.runtime.lastError) {
      //   console.error('截图失败:', browser.runtime.lastError.message);
      //   reject(new Error(`截图失败: ${browser.runtime.lastError.message}`));
      //   return;
      // }
      
      if (!dataUrl) {
        reject(new Error('截图失败：未获取到有效的图像数据'));
        return;
      }
      
      console.log('截图成功');
      resolve(dataUrl);
    });
  });
}


// scrollIntoView
// devicePixelRatio: window.devicePixelRatio || 1
export async function captureVisibleElement(selector: string,fmt: 'jpeg' | 'png' = 'png', quality?: number): Promise<Base64URLString> {
  const rect = await evalGetBoundingClientRect(selector);
  return captureWithRect(rect,fmt,quality)
}
export async function captureWithRect(rect: Rect,fmt: 'jpeg' | 'png' = 'png', quality?: number): Promise<Base64URLString> {
  const dataUrl = await captureVisibleTab();
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      console.warn('onload',rect)
      try {
        // 创建Canvas元素
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('无法创建Canvas上下文'));
        }
        
        const ratio = 2
        // 设置Canvas尺寸为元素尺寸
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        
        // 在Canvas上绘制裁切后的图像
        ctx.drawImage(
          img,
          rect.x * ratio,
          rect.y * ratio,
          rect.width * ratio,
          rect.height * ratio,
          0, 0,
          rect.width * ratio,
          rect.height * ratio
        );
        
        // 将Canvas转换为DataURL
        const croppedDataUrl = canvas.toDataURL(`image/${fmt}`, fmt === 'jpeg' ? (quality !== undefined ? quality : 90) / 100 : undefined);
        resolve(croppedDataUrl);
      } catch (err) {
        console.error('裁切图片失败:', err);
        resolve(dataUrl);
      }
    };
      
      img.onerror = () => {
        console.error('加载图片失败');
        resolve(dataUrl);
      };
      
      img.src = dataUrl;
  })


}

export async function evalGetBoundingClientRect(selector:string) {
  const rect = await evalInConsole((selector)=>{
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect(); //属性来自DOMRect对象原型链，不能{...DOMRect}
      return {
        x:rect.x,
        y:rect.y,
        width: rect.width,
        height: rect.height,
        // top: rect.top,
        // right: rect.right,
        // bottom: rect.bottom,
        // left: rect.left,
        isInViewport:(
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth
        ),
        winW:window.innerWidth,
        devicePixelRatio: window.devicePixelRatio || 1
      };
    },[selector])
  if(!rect) throw new Error(`selector not found:${selector}`,)
  if(!rect.isInViewport) throw new Error(`selector not in viewport,${rect}`)
  return rect;
}
type UnpackPromise<T> = T extends Promise<infer U> ? U : T;
type Rect = UnpackPromise<ReturnType<typeof evalGetBoundingClientRect>>

export async function evalInConsole<T = string|number,R=any>(fnWithoutSideEffect: (...fnArgs:T[])=>R,fnArgs:T[]):Promise<R>{
  console.warn(`(${fnWithoutSideEffect.toString()})(${fnArgs.map(x=>JSON.stringify(x)).join(',')})`)
  return new Promise((resolve, reject) => {
    browser.devtools.inspectedWindow.eval(
      `(${fnWithoutSideEffect.toString()})(${fnArgs.map(x=>JSON.stringify(x)).join(',')})`,
      (result:R, e) => {
        console.warn('evalInConsole:',result,e)
        if (e) {
          console.error("evalInConsole:", e)
          reject(e)
        }
        resolve(result)
      }
    );
  })
}

export async function waitForFrame(timeout=0) {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      setTimeout(resolve, timeout); // 确保在布局/绘制之后
    });
  });
}


async function attachDebugger() {
  const tabId = browser.devtools.inspectedWindow.tabId;
  try {
    await browser.debugger.attach({ tabId }, '1.3');
    return true;
  } catch (err) {
    console.error('Attach failed:', err);
    return false;
  }
}


async function dispatchTouchEvent() {
  try {
    await browser.debugger.sendCommand(
      { tabId: browser.devtools.inspectedWindow.tabId },
      'Input.dispatchTouchEvent',
      {
        type:'touchStart',
        touchPoints: [{
          x: 327,
          y: 644,
          radiusX: 11.5,
          radiusY: 11.5,
          force: 1
        }]
      }
    );
  } catch (err) {
    console.error('Touch event failed:', err);
  }
}

export function exportJson(exportData:any,filename:string){
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
import { encode } from 'cbor-x';
export function exportCBOR(exportData:any,filename:string){
  const cborData = encode(exportData);
  const blob = new Blob([cborData], { type: 'application/cbor' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.cbor`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}