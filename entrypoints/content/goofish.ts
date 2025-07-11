export default defineContentScript({
  matches: ['*://*.goofish.com/*'],
  allFrames: true,
  main() {
    injectScript(browser.runtime.getURL('/goofish_inject.js'));
  },
});