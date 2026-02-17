import { test as setup, expect } from '@playwright/test'
import { mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'

const authFile = './playwright/.auth/user.json'

setup('autenticar usuario admin', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill('admin@clinic.com')
  await page.locator('#password').fill('password123')
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await page.waitForURL(/dashboard/, { timeout: 15000 })
  
  // Verify we're logged in
  await expect(page.getByText('HC Gestor')).toBeVisible()
  
  // Save storage state for reuse
  const dir = dirname(authFile)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  await page.context().storageState({ path: authFile as any })
})

setup('autenticar usuario doctor', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill('doctor@clinic.com')
  await page.locator('#password').fill('password123')
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await page.waitForURL(/dashboard/, { timeout: 15000 })
  
  // Verify we're logged in
  await expect(page.getByText('HC Gestor')).toBeVisible()
  
  // Save storage state for reuse
  const authFileDoctor = './playwright/.auth/doctor.json'
  const dir = dirname(authFileDoctor)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  await page.context().storageState({ path: authFileDoctor as any })
})
