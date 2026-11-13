import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import legacy from '@vitejs/plugin-legacy'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  base: './',
  plugins: [
    preact(),
    legacy({ targets: ['chrome >= 38'], renderModernChunks: false }),
  ],
  server: { port: 5556, fs: { allow: ['..'] } },
  build: {
    outDir: 'dist',
    cssTarget: 'chrome38',
    assetsInlineLimit: 0,
  },
  css: {
    preprocessorOptions: { scss: { api: 'modern-compiler' } },
    postcss: { plugins: [autoprefixer({ overrideBrowserslist: ['chrome >= 38'] })] },
  },
})
