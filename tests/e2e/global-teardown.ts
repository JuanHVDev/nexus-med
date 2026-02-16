import { test as teardown } from '@playwright/test'

teardown('cleanup', async () => {
  console.log('🧹 Cleaning up test environment...')
  // Aquí se puede agregar limpieza si es necesario
})
