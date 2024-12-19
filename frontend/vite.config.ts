import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      // Explicitly ignore platform-specific optional dependencies
      external: [
        '@rollup/rollup-darwin-arm64',
        '@rollup/rollup-linux-x64',
        '@rollup/rollup-win32-x64',
      ],
    },
  },
})
