import { defineConfig } from 'vitest/config'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
})
