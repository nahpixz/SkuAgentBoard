import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite'
import path from 'path';
// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'biliMall',
    version: '1.0.0',
    permissions: [
      'webNavigation'
    ],
    host_permissions: [
      "http://*/*",
      "https://*/*",
      "*://*/*"
    ],
    web_accessible_resources: [{
      matches: ['*://*.goofish.com/*'],
      resources: ['/inject.js'],
    }],
  },
  webExt: {
    disabled: true,
  },
  
  vite: (env) => ({
    plugins: [tailwindcss()],
    resolve:{
      alias:{
        '@/premium':path.resolve(__dirname, `premium/${import.meta.env.VITE_FREE_VERSION?'unimpl':'index'}.ts`)
      }
    }
  })
});
