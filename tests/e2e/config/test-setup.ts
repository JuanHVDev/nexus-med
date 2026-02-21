import { test as setup, expect } from '@playwright/test'

const DEMO_EMAIL = 'admin@clinica.com'
const DEMO_PASSWORD = 'password123'

setup('autenticate with demo account', async ({ page }) => {
  await page.goto('/login')
  
  await page.fill('input[id="email"]', DEMO_EMAIL)
  await page.fill('input[id="password"]', DEMO_PASSWORD)
  await page.click('button[type="submit"]')
  
  await page.waitForURL('/dashboard', { timeout: 15000 })
  
  await expect(page.locator('h1')).toContainText('Dashboard')
})
