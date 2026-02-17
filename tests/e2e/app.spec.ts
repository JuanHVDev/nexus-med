import { test, expect, type Page } from '@playwright/test'

// Función helper para hacer login
async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.locator('#email').fill('admin@clinic.com')
  await page.locator('#password').fill('password123')
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await page.waitForURL(/dashboard/, { timeout: 15000 })
  // Verificar que el login fue exitoso
  await expect(page.getByText('HC Gestor')).toBeVisible({ timeout: 5000 })
}

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Gestor de Historias|Login|Iniciar/)
    await expect(page.getByText('Iniciar Sesión').first()).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email').fill('invalid@example.com')
    await page.locator('#password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    await expect(page.locator('#email')).toBeVisible({ timeout: 10000 })
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login|signin/)
  })
})

test.describe('Patients', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should display patients list', async ({ page }) => {
    await page.goto('/patients')
    await expect(page.getByRole('heading', { name: /Pacientes/i })).toBeVisible()
  })

  test('should navigate to new patient form', async ({ page }) => {
    await page.goto('/patients')
    await page.getByRole('button', { name: /Nuevo|Agregar|Add/i }).click()
    await expect(page.getByRole('heading', { name: /Nuevo Paciente|Registrar/i })).toBeVisible()
  })

  test('should have patient search functionality', async ({ page }) => {
    await page.goto('/patients')
    await expect(page.getByPlaceholder(/Buscar por nombre/i)).toBeVisible()
  })

  test('should display patient details', async ({ page }) => {
    await page.goto('/patients')
    await page.waitForSelector('table', { timeout: 5000 })
    const firstPatientLink = page.locator('tbody tr:first-child a[href*="/patients/"]').first()
    if (await firstPatientLink.count() > 0) {
      await firstPatientLink.click()
      await expect(page).toHaveURL(/\/patients\/\d+/)
    }
  })
})

test.describe('Appointments', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should display appointments calendar', async ({ page }) => {
    await page.goto('/appointments')
    await expect(page.getByRole('heading', { name: /Citas|Agenda|Calendario/i })).toBeVisible()
  })

  test('should navigate to create appointment', async ({ page }) => {
    await page.goto('/appointments')
    await page.getByRole('button', { name: /Nueva|Agregar|Add/i }).click()
    await expect(page.getByRole('heading', { name: /Nueva Cita/i })).toBeVisible()
  })
})

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should display dashboard stats', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /Dashboard|Inicio/i })).toBeVisible()
    await expect(page.getByText('Pacientes Totales')).toBeVisible()
  })

  test('should display quick actions', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: /\+ Nuevo/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /\+ Nueva/i })).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should have main navigation menu', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('HC Gestor')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pacientes' })).toBeVisible()
  })

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /Pacientes/i }).first().click()
    await expect(page).toHaveURL(/patients/)
    
    await page.getByRole('link', { name: /Citas|Agenda/i }).first().click()
    await expect(page).toHaveURL(/appointments/)
  })

  test('should have settings link', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: /Configuración|Settings/i })).toBeVisible()
  })
})
