import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/integration/setup/db-setup.ts'],
    include: ['tests/integration/**/*.test.ts'],
    exclude: [
      '**/*.d.ts',
      '**/*.config.ts',
    ],
    testTimeout: 60000,
    hookTimeout: 120000,
    maxConcurrency: 1,
    sequence: {
      shuffle: false,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
