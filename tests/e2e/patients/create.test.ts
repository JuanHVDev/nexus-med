import { test, expect } from '@playwright/test'

test.describe('Create Patient', () => {
  test('should display patient form', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 20000 })

    await page.goto('/patients/new')
    await expect(page.getByRole('heading', { name: 'Nuevo Paciente' })).toBeVisible({ timeout: 10000 })
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 20000 })

    await page.goto('/patients/new')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Nombre debe tener al menos')).toBeVisible({ timeout: 10000 })
  })

  test('should validate CURP', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 20000 })

    await page.goto('/patients/new')
    await page.fill('input[id="firstName"]', 'Juan')
    await page.fill('input[id="lastName"]', 'Pérez')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=CURP')).toBeVisible({ timeout: 10000 })
  })
})
