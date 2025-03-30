import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import history from 'connect-history-api-fallback'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true,
    port: 3000, 
    cors: false,
    strictPort: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    proxy: {
      '/binance': {
        target: 'https://api.binance.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/binance/, '/api/v3/exchangeInfo') // Adjusting the path here
      },
      '/api': {
        target: 'http://node-red:1880',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '') // Adjusting the path here
      }
    },
    middleware: [
      history({
        verbose: true,
        disableDotRule: true,
        htmlAcceptHeaders: ['text/html', 'application/xhtml+xml']
      })
    ]
  },
preview: {
    port: 3000,
    allowedHosts: ['*.gitpod.io'],
  },
  base: '/',
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
