import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5180',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'bun run dev',
    port: 5180,
    reuseExistingServer: true,
    timeout: 15000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
