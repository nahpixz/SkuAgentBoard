 export default defineUnlistedScript(async () => {
    console.warn("Permanently blocked window.open");
    Object.defineProperty(window, 'open', {
      writable: false,
      value: function(url: string) {
        window.location.assign(url);
        return null;
      }
    });
});