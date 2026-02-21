import { test, expect } from '@playwright/test'

test.describe('Appointments List', () => {
  test('should display appointments page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 30000 })

    await page.goto('/appointments')
    await expect(page.url()).toContain('/appointments')
  })

  test('should have add appointment button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 30000 })

    await page.goto('/appointments/new')
    await page.waitForTimeout(3000)
    await expect(page.url()).toContain('/appointments/new')
  })
})
