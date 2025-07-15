
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

