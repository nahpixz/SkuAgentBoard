export default defineContentScript({
  matches: ['*://*.goofish.com/*'],
  allFrames: true,
  main() {
    injectScript(browser.runtime.getURL("/inject.js"));
  },
});

function injectScript(file_path:string) {
    var node = document.getElementsByTagName('body')[0];
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', file_path);
    node.appendChild(script);
}