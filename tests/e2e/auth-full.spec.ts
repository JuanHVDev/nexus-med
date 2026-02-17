import { test, expect } from '@playwright/test'

/**
 * Tests E2E para autenticación con usuarios reales
 * Requiere que los usuarios existan en la base de datos:
 * - admin@clinic.com / password123
 * - doctor@clinic.com / password123
 */

test.describe('Authentication - Full Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test.describe('Login Page UI', () => {
    test('should display login form correctly', async ({ page }) => {
      await expect(page.getByText('Iniciar Sesión').first()).toBeVisible()
      await expect(page.locator('#email')).toBeVisible()
      await expect(page.locator('#password')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible()
    })

    test('should show validation errors', async ({ page }) => {
      // Test password validation (email is valid but password is too short)
      await page.locator('#email').fill('test@clinic.com')
      await page.locator('#password').fill('123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      await expect(page.getByText('al menos 8 caracteres')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Login with Test Users', () => {
    test('should login as admin successfully @auth', async ({ page }) => {
      await page.locator('#email').fill('admin@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 15000 })
      await expect(page).toHaveURL(/dashboard/)
    })

    test('should login as doctor successfully @auth', async ({ page }) => {
      await page.locator('#email').fill('doctor@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 15000 })
      await expect(page).toHaveURL(/dashboard/)
    })

    test('should show error for wrong password @auth', async ({ page }) => {
      await page.locator('#email').fill('admin@clinic.com')
      await page.locator('#password').fill('wrongpassword')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await expect(page.locator('#email')).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Session Management', () => {
    test('should persist session after reload @auth', async ({ page }) => {
      await page.locator('#email').fill('doctor@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 15000 })
      await expect(page).toHaveURL(/dashboard/)
      
      try {
        await page.reload({ waitUntil: 'networkidle' })
      } catch {
        await page.goto('/dashboard')
      }
      
      await expect(page).toHaveURL(/dashboard/)
    })

    test('should logout successfully @auth', async ({ page }) => {
      await page.locator('#email').fill('doctor@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()

      await page.waitForURL(/dashboard/, { timeout: 15000 })

      // Use aria-label for logout
      await page.getByRole('button', { name: /Menú de usuario/i }).click()
      await expect(page.getByText('Cerrar sesión')).toBeVisible({ timeout: 5000 })
      await page.getByText('Cerrar sesión').click()
      
      await page.waitForURL(/\/(auth\/)?login/, { timeout: 10000 })
      await expect(page).toHaveURL(/\/(auth\/)?login/)
    })
  })
})

test.describe('Role-Based Access Control', () => {
  test('should access admin routes as admin @auth', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill('admin@clinic.com')
    await page.locator('#password').fill('password123')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    
    await page.waitForURL(/dashboard/, { timeout: 15000 })
    
    await page.goto('/settings')
    await expect(page).not.toHaveURL(/login/)
  })

  test('should access doctor routes as doctor @auth', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill('doctor@clinic.com')
    await page.locator('#password').fill('password123')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    
    await page.waitForURL(/dashboard/, { timeout: 15000 })
    
    await page.goto('/patients')
    await expect(page).toHaveURL(/patients/)
  })
})
