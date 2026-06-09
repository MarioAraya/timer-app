import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.BASE_URL || 'http://localhost:5177'
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: isCI ? 1 : 0,
  timeout: 15000,
  use: {
    baseURL,
    headless: true,
    locale: 'es-ES',
  },
  // En CI la app ya está corriendo en .104; solo levanta dev server en local
  ...(!isCI && {
    webServer: {
      command: 'npm run dev',
      url: baseURL,
      reuseExistingServer: true,
      timeout: 30000,
    },
  }),
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
