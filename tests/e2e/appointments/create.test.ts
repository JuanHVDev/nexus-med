import { test, expect } from '@playwright/test'

test.describe('Create Appointment', () => {
  test('should display appointment form', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 20000 })

    await page.goto('/appointments/new')
    await expect(page.getByRole('heading', { name: 'Nueva Cita' })).toBeVisible({ timeout: 10000 })
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 20000 })

    await page.goto('/appointments/new')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Paciente requerido')).toBeVisible({ timeout: 10000 })
  })
})
