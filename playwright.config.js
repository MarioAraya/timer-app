import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:5555',
    headless: true,
    locale: 'es-ES',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5555',
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
