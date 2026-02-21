import { test, expect } from '@playwright/test'

test.describe('Register', () => {
  test('should display registration form', async ({ page }) => {
    const response = await page.goto('/register')
    expect(response?.status()).toBe(200)
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
    await page.click('button[type="submit"]')
    await expect(page.locator('text=El nombre debe tener')).toBeVisible({ timeout: 30000 })
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', 'Test1234')
    await page.fill('input[name="confirmPassword"]', 'Test1234')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Correo electrónico')).toBeVisible({ timeout: 30000 })
  })

  test('should validate password match', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="password"]', 'Test1234')
    await page.fill('input[name="confirmPassword"]', 'Different123')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=contraseñas no')).toBeVisible({ timeout: 30000 })
  })

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="password"]', 'weak')
    await page.fill('input[name="confirmPassword"]', 'weak')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=8 caracteres')).toBeVisible({ timeout: 30000 })
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('form')).toBeVisible({ timeout: 30000 })
    await page.click('text=Inicia sesión aquí')
    await expect(page).toHaveURL('/login')
  })
})
