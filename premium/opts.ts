
export async function ScrollToEnd_bilimall() {
  return new Promise((resolve, reject) => {
    browser.devtools.inspectedWindow.eval(
      `$('.scroll-view-container').scrollTop = $('.scroll-view-container').scrollHeight`,
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

