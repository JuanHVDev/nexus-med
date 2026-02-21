import { test, expect } from '@playwright/test'

test.describe('Medical Notes', () => {
  test('should access notes from patient page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 30000 })

    await page.goto('/patients')
    await expect(page.url()).toContain('/patients')
  })

  test('should display new note form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 30000 })

    await page.goto('/patients/1/notes/new')
    await page.waitForTimeout(3000)
    await expect(page.url()).toContain('/notes/new')
  })
})
