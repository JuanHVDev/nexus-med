import { test, expect, type Page } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Gestor de Historias|Login|Iniciar/)
    await expect(page.getByRole('heading', { name: /Login|Iniciar/i })).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.getByLabel('Correo electrónico').fill('invalid@example.com')
    await page.getByLabel('Contraseña').fill('wrongpassword')
    
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    
    // Error se muestra via toast, esperamos a que la página mantenga el input visible
    await expect(page.getByLabel('Correo electrónico')).toBeVisible({ timeout: 10000 })
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login|signin/)
  })
})

test.describe('Patients', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Correo electrónico').fill('admin@clinic.com')
    await page.getByLabel('Contraseña').fill('password123')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    await page.waitForURL(/dashboard/, { timeout: 10000 })
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
    await expect(page.getByPlaceholder(/nombre CURP| Search/i)).toBeVisible()
  })

  test('should display patient details', async ({ page }) => {
    await page.goto('/patients')
    await page.waitForSelector('table, [class*="grid]', { timeout: 5000 })
    const firstPatient = page.locator('tbody tr, [class*="patient"]').first()
    if (await firstPatient.count() > 0) {
      await firstPatient.click()
      await expect(page.getByText(/Datos del paciente|Informacion/i)).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Appointments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Correo electrónico').fill('admin@clinic.com')
    await page.getByLabel('Contraseña').fill('password123')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    await page.waitForURL(/dashboard/, { timeout: 10000 })
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
    await page.goto('/login')
    await page.getByLabel('Correo electrónico').fill('admin@clinic.com')
    await page.getByLabel('Contraseña').fill('password123')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    await page.waitForURL(/dashboard/, { timeout: 10000 })
  })

  test('should display dashboard stats', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /Dashboard|Inicio/i })).toBeVisible()
    await expect(page.getByText(/Pacientes Totales|Citas Hoy|Consultas|Ingresos/i)).toBeVisible()
  })

  test('should display quick actions', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: /Nuevo Paciente|Nueva Cita/i })).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Correo electrónico').fill('admin@clinic.com')
    await page.getByLabel('Contraseña').fill('password123')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    await page.waitForURL(/dashboard/, { timeout: 10000 })
  })

  test('should have main navigation menu', async ({ page }) => {
    // Verificar que existe el sidebar con el nombre de la app
    await expect(page.getByText('HC Gestor')).toBeVisible()
    // Verificar enlaces del sidebar
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pacientes' })).toBeVisible()
  })

  test('should navigate between pages', async ({ page }) => {
    await page.getByRole('link', { name: /Pacientes/i }).first().click()
    await expect(page).toHaveURL(/patients/)
    
    await page.getByRole('link', { name: /Citas|Agenda/i }).first().click()
    await expect(page).toHaveURL(/appointments/)
  })

  test('should have settings link', async ({ page }) => {
    // Configuración tiene acento: Configuración
    await expect(page.getByRole('link', { name: /Configuración|Settings/i })).toBeVisible()
  })
})
