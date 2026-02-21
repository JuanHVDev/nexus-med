import { test, expect } from '@playwright/test'

test.describe('Login', () => {
  test('should display login form', async ({ page }) => {
    const response = await page.goto('/login')
    expect(response?.status()).toBe(200)
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
    await page.fill('input[id="email"]', 'admin@clinica.com')
    await page.fill('input[id="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/dashboard', { timeout: 30000 })
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
    await page.fill('input[id="email"]', 'invalid@test.com')
    await page.fill('input[id="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await page.waitForTimeout(3000)
    const errorText = await page.locator('body').textContent()
    expect(errorText).toContain('Error')
  })

  test('should validate empty fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
    await page.click('button[type="submit"]')

    await page.waitForTimeout(5000)
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toMatch(/requerido|inválido|Error/i)
  })

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
    await page.click('text=Regístrate aquí')
    await expect(page).toHaveURL('/register')
  })
})
