import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Más retries para estabilidad
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  // Timeouts globales
  timeout: 90000, // 90s por test
  expect: {
    timeout: 10000, // 10s para aserciones
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Timeouts de acción y navegación
    actionTimeout: 90000,
    navigationTimeout: 90000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/, // Archivo de setup
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'], // Depende del setup
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'pnpm dev --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 900000, // 15 minutos para arrancar
    env: {
      NODE_ENV: 'test',
    },
  },
})
