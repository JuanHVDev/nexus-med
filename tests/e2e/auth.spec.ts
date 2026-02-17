import { test, expect } from '@playwright/test'

test.describe('Authentication - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await expect(page.getByText('Iniciar Sesión').first()).toBeVisible()
      await expect(page.locator('#email')).toBeVisible()
      await expect(page.locator('#password')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible()
    })

    test('should show error for invalid email format', async ({ page }) => {
      await page.locator('#email').fill('invalid@')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await expect(page.locator('#email')).toBeVisible({ timeout: 5000 })
    })

    test('should show error for empty password', async ({ page }) => {
      await page.locator('#email').fill('doctor@clinic.com')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await expect(page.locator('#password')).toBeVisible({ timeout: 5000 })
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.locator('#email').fill('doctor@clinic.com')
      await page.locator('#password').fill('wrongpassword')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await expect(page.locator('#email')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Successful Login', () => {
    test('should login as admin and redirect to dashboard', async ({ page }) => {
      await page.locator('#email').fill('admin@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 15000 })
      await expect(page).toHaveURL(/dashboard/)
    })

    test('should login as doctor and show dashboard', async ({ page }) => {
      await page.locator('#email').fill('doctor@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 15000 })
      await expect(page.getByText('HC Gestor')).toBeVisible()
    })

    test('should persist session after page reload', async ({ page }) => {
      await page.locator('#email').fill('doctor@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 15000 })
      
      await page.reload()
      
      await expect(page).toHaveURL(/dashboard/)
      await expect(page.getByText('HC Gestor')).toBeVisible()
    })
  })

  test.describe('Logout', () => {
    test('should logout and redirect to login', async ({ page }) => {
      await page.locator('#email').fill('doctor@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 15000 })
      
      // Use more robust selector for logout
      await page.getByRole('button', { name: /A/i }).click()
      await expect(page.getByText('Cerrar sesión')).toBeVisible()
      await page.getByText('Cerrar sesión').click()
      
      await page.waitForURL(/login/, { timeout: 10000 })
      await expect(page).toHaveURL(/login/)
    })

    test('should require login after logout', async ({ page }) => {
      await page.locator('#email').fill('doctor@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 15000 })
      
      await page.getByRole('button', { name: /A/i }).click()
      await expect(page.getByText('Cerrar sesión')).toBeVisible()
      await page.getByText('Cerrar sesión').click()
      
      await page.waitForURL(/login/, { timeout: 10000 })
      
      await page.goto('/dashboard')
      
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
      await expect(page.locator('#email, #password')).toBeVisible({ timeout: 10000 })
    })

    test('should allow authenticated users to access protected routes', async ({ page }) => {
      await page.locator('#email').fill('doctor@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 15000 })
      
      await page.goto('/patients')
      await expect(page).toHaveURL(/patients/)
      
      await page.goto('/appointments')
      await expect(page).toHaveURL(/appointments/)
    })
  })

  test.describe('Role-Based Access', () => {
    test('should show admin menu for admin user', async ({ page }) => {
      await page.locator('#email').fill('admin@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 15000 })
      
      await expect(page.getByRole('link', { name: 'Configuración' })).toBeVisible()
    })

    test('should show doctor menu for doctor user', async ({ page }) => {
      await page.locator('#email').fill('doctor@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 15000 })
      
      await expect(page.getByRole('link', { name: 'Pacientes' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Citas' })).toBeVisible()
    })
  })

  test.describe('Session Management', () => {
    test('should maintain session across tabs', async ({ context, page }) => {
      await page.locator('#email').fill('doctor@clinic.com')
      await page.locator('#password').fill('password123')
      await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
      
      await page.waitForURL(/dashboard/, { timeout: 15000 })
      
      const newPage = await context.newPage()
      await newPage.goto('/dashboard')
      
      await expect(newPage).toHaveURL(/dashboard/)
    })
  })
})
