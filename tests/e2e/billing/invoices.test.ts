import { test, expect } from '@playwright/test'

test.describe('Billing - Invoices', () => {
  test('should display billing page', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 20000 })

    await page.goto('/billing')
    await expect(page.getByRole('heading', { name: 'Facturación' })).toBeVisible({ timeout: 10000 })
  })

  test('should display billing content', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 20000 })

    await page.goto('/billing')
    await page.waitForLoadState('networkidle')
    await expect(page.url()).toContain('/billing')
  })
})
