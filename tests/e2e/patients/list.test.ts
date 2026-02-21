import { test, expect } from '@playwright/test'

test.describe('Patients List', () => {
  test.use({ storageState: {} })

  test('should list patients after login', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 20000 })

    await page.goto('/patients')
    await expect(page.getByRole('heading', { name: 'Pacientes' })).toBeVisible({ timeout: 10000 })
  })

  test('should display patients page', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 20000 })

    await page.goto('/patients')
    await page.waitForLoadState('networkidle')
    await expect(page.url()).toContain('/patients')
  })

  test('should have add patient button', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 20000 })

    await page.goto('/patients')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('a[href="/patients/new"]')).toBeVisible({ timeout: 10000 })
  })
})
