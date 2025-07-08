export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  // browser.webNavigation.onBeforeNavigate.addListener(
  //   (details) => {
  //     if (details.frameId === 0) {
  //       // 仅处理主框架
  //       console.log("before navigate", details);
  //       // browser.tabs.update(details.tabId, { url: details.url });
  //       browser.tabs.remove(details.tabId);
  //       return { cancel: true }; // 取消原跳转
  //     }
  //   },
  //   { url: [{ schemes: ["http", "https"] }] }
  // );
});

