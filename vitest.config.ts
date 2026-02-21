import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: [
      '**/*.d.ts',
      '**/*.config.ts',
      'tests/integration/**',
      'tests/e2e/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'lib/validations/**/*.ts',
        'lib/utils.ts'
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.config.ts',
        'tests/**'
      ],
      thresholds: {
        lines: 95,
        functions: 85,
        branches: 85,
        statements: 95
      }
    },
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
