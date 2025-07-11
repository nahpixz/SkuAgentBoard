
export function ScrollToEnd_bilimall() {
  browser.devtools.inspectedWindow.eval(
    `$('.scroll-view-container').scrollTop = $('.scroll-view-container').scrollHeight`,
    (result, e) => e && console.error("BiliMallScrollToEnd:", e)
  );
}
