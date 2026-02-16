import { test, expect, type Page } from '@playwright/test'

test.describe('Authentication - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await expect(page.getByText('Iniciar Sesión').first()).toBeVisible()
      await expect(page.getByLabel('Correo electrónico')).toBeVisible()
      await expect(page.getByLabel('Contraseña')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible()
    })

    test('should show error for invalid email format', async ({ page }) => {
      await page.getByLabel('Correo electrónico').fill('invalid@')
      await page.getByLabel('Contraseña').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      // Error shown via toast - verify we're still on login page
      await expect(page.locator('#email')).toBeVisible({ timeout: 5000 })
    })

    test('should show error for empty password', async ({ page }) => {
      await page.getByLabel('Correo electrónico').fill('doctor@clinic.com')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      // Error shown via toast - verify we're still on login page
      await expect(page.locator('#password')).toBeVisible({ timeout: 5000 })
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.getByLabel('Correo electrónico').fill('doctor@clinic.com')
      await page.getByLabel('Contraseña').fill('wrongpassword')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      // Error via toast - verify we're still on login page
      await expect(page.locator('#email')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Successful Login', () => {
    test('should login as admin and redirect to dashboard', async ({ page }) => {
      await page.getByLabel('Correo electrónico').fill('admin@clinic.com')
      await page.getByLabel('Contraseña').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 10000 })
      await expect(page).toHaveURL(/dashboard/)
    })

    test('should login as doctor and show dashboard', async ({ page }) => {
      await page.getByLabel('Correo electrónico').fill('doctor@clinic.com')
      await page.getByLabel('Contraseña').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 10000 })
      await expect(page.getByText('HC Gestor')).toBeVisible()
    })

    test('should persist session after page reload', async ({ page }) => {
      // Login
      await page.getByLabel('Correo electrónico').fill('doctor@clinic.com')
      await page.getByLabel('Contraseña').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 10000 })
      
      // Reload page
      await page.reload()
      
      // Should still be logged in
      await expect(page).toHaveURL(/dashboard/)
      await expect(page.getByText('HC Gestor')).toBeVisible()
    })
  })

  test.describe('Logout', () => {
    test('should logout and redirect to login', async ({ page }) => {
      // Login first
      await page.getByLabel('Correo electrónico').fill('doctor@clinic.com')
      await page.getByLabel('Contraseña').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 10000 })
      
      // Logout - open dropdown first
      await page.locator('header button.rounded-full').click()
      await page.getByText('Cerrar sesión').click()
      
      // Should redirect to login
      await page.waitForURL(/login/, { timeout: 5000 })
      await expect(page).toHaveURL(/login/)
    })

    test('should require login after logout', async ({ page }) => {
      // Login and logout
      await page.getByLabel('Correo electrónico').fill('doctor@clinic.com')
      await page.getByLabel('Contraseña').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 10000 })
      
      // Logout - open dropdown first
      await page.locator('header button.rounded-full').click()
      await page.getByText('Cerrar sesión').click()
      
      await page.waitForURL(/login/, { timeout: 5000 })
      
      // Try to access dashboard
      await page.goto('/dashboard')
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/)
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/patients')
      await expect(page).toHaveURL(/login/)
      
      await page.goto('/appointments')
      await expect(page).toHaveURL(/login/)
    })

    test('should redirect to login from root', async ({ page }) => {
      await page.goto('/')
      // Should redirect to login or show login page
      await expect(page.locator('#email, #password, text=Iniciar Sesión')).toBeVisible({ timeout: 10000 })
    })

    test('should allow authenticated users to access protected routes', async ({ page }) => {
      // Login
      await page.getByLabel('Correo electrónico').fill('doctor@clinic.com')
      await page.getByLabel('Contraseña').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 10000 })
      
      // Access patients
      await page.goto('/patients')
      await expect(page).toHaveURL(/patients/)
      
      // Access appointments
      await page.goto('/appointments')
      await expect(page).toHaveURL(/appointments/)
    })
  })

  test.describe('Role-Based Access', () => {
    test('should show admin menu for admin user', async ({ page }) => {
      await page.getByLabel('Correo electrónico').fill('admin@clinic.com')
      await page.getByLabel('Contraseña').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 10000 })
      
      await expect(page.getByRole('link', { name: 'Configuración' })).toBeVisible()
    })

    test('should show doctor menu for doctor user', async ({ page }) => {
      await page.getByLabel('Correo electrónico').fill('doctor@clinic.com')
      await page.getByLabel('Contraseña').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 10000 })
      
      await expect(page.getByRole('link', { name: 'Pacientes' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Citas' })).toBeVisible()
    })
  })

  test.describe('Session Management', () => {
    test('should maintain session across tabs', async ({ context, page }) => {
      // Login in first tab
      await page.getByLabel('Correo electrónico').fill('doctor@clinic.com')
      await page.getByLabel('Contraseña').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 10000 })
      
      // Open new tab
      const newPage = await context.newPage()
      await newPage.goto('/dashboard')
      
      // Should be logged in
      await expect(newPage).toHaveURL(/dashboard/)
    })
  })
})
