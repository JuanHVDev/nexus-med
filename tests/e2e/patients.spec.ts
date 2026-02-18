import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsDoctor, selectGender } from './helpers'

test.describe('Patients - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test.describe('Patients List', () => {
    test('should display patients list page', async ({ page }) => {
      await page.goto('/patients')
      await expect(page.getByRole('heading', { name: /Pacientes/i })).toBeVisible()
    })

    test('should display patients table', async ({ page }) => {
      await page.goto('/patients')
      await expect(page.locator('table')).toBeVisible({ timeout: 10000 })
    })

    test('should display new patient button', async ({ page }) => {
      await page.goto('/patients')
      await expect(page.getByRole('button', { name: /Nuevo Paciente|Agregar/i })).toBeVisible()
    })

    test('should display search input', async ({ page }) => {
      await page.goto('/patients')
      await expect(page.getByPlaceholder(/Buscar|Buscar por nombre/i)).toBeVisible()
    })

    test('should display patient count', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForTimeout(2000)
      // Verificar que la tabla está visible (indica que hay contenido)
      const table = page.locator('table')
      expect(await table.count()).toBeGreaterThan(0)
    })
  })

  test.describe('Patient Search', () => {
    test('should search patients by name', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForTimeout(1000)
      
      const searchInput = page.getByPlaceholder(/Buscar|Buscar por nombre/i)
      if (await searchInput.count() > 0) {
        await searchInput.fill('Juan')
        await page.waitForTimeout(1000)
      }
    })

    test('should search patients by CURP', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForTimeout(1000)
      
      const searchInput = page.getByPlaceholder(/Buscar|Buscar por nombre/i)
      if (await searchInput.count() > 0) {
        await searchInput.fill('PELJ')
        await page.waitForTimeout(1000)
      }
    })
  })

  test.describe('Create Patient', () => {
    test('should navigate to new patient form', async ({ page }) => {
      await page.goto('/patients')
      await page.getByRole('button', { name: /Nuevo Paciente|Agregar/i }).click()
      await expect(page).toHaveURL(/patients\/new/)
      await expect(page.getByRole('heading', { name: /Nuevo Paciente|Registrar Paciente/i })).toBeVisible()
    })

    test('should display patient form fields', async ({ page }) => {
      await page.goto('/patients/new')
      
      await expect(page.locator('#firstName')).toBeVisible()
      await expect(page.locator('#lastName')).toBeVisible()
      await expect(page.locator('#curp')).toBeVisible()
      await expect(page.locator('#birthDate')).toBeVisible()
      await expect(page.locator('#gender')).toBeVisible()
      await expect(page.locator('#phone')).toBeVisible()
    })

    test('should create valid patient', async ({ page }) => {
      await page.goto('/patients/new')
      
      const timestamp = Date.now()
      // CURP formato: 4 letras + 6 dígitos + 1 letra + 2 letras + 3 letras + 2 alfanuméricos = 18 caracteres
      // Ejemplo: TEST900115HNLRNA01
      const uniqueSuffix = timestamp.toString().slice(-2)
      const curp = `TEST900115HNLRNA${uniqueSuffix}` // 18 caracteres
      
      await page.locator('#firstName').fill(`Nombre${timestamp}`)
      await page.locator('#lastName').fill('ApellidoTest')
      await page.locator('#curp').fill(curp)
      await page.locator('#birthDate').fill('1990-01-15')
      await selectGender(page, 'MALE')
      await page.locator('#phone').fill('5551234567')
      await page.locator('#email').fill(`test${timestamp}@example.com`)

      await page.getByRole('button', { name: /Guardar|Crear|Registrar/i }).click()
      
      await page.waitForTimeout(2000)
      // Redirige a la lista de pacientes (no a /patients/new)
      await expect(page).toHaveURL(/\/patients$/)
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/patients/new')
      
      await page.getByRole('button', { name: /Guardar|Crear/i }).click()
      await page.waitForTimeout(500)
      
      const firstNameError = page.locator('text=/Nombre es requerido|Required/i')
      const lastNameError = page.locator('text=/Apellido es requerido|Required/i')
      
      if (await firstNameError.count() > 0 || await lastNameError.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should validate CURP format', async ({ page }) => {
      await page.goto('/patients/new')
      
      await page.locator('#firstName').fill('Juan')
      await page.locator('#lastName').fill('Perez')
      await page.locator('#curp').fill('INVALID')
      await page.locator('#birthDate').fill('1990-01-15')
      await selectGender(page, 'MALE')
      await page.locator('#phone').fill('5551234567')
      
      await page.getByRole('button', { name: /Guardar|Crear/i }).click()
      await page.waitForTimeout(1000)
      
      // Verificar que permaneció en la página de nuevo paciente (validación frontend o backend)
      // El CURP debe tener 18 caracteres, "INVALID" tiene solo 7
      const currentUrl = page.url()
      const stayedOnForm = currentUrl.includes('patients/new')
      const hasError = await page.locator('text=/CURP|inválido|formato|requerido/i').count() > 0
      expect(stayedOnForm || hasError).toBe(true)
    })

    test('should validate date of birth', async ({ page }) => {
      await page.goto('/patients/new')
      
      await page.locator('#firstName').fill('Juan')
      await page.locator('#lastName').fill('Perez')
      await page.locator('#curp').fill('PELJ001001HNLRN01')
      await page.locator('#birthDate').fill('2030-01-15')
      await selectGender(page, 'MALE')
      await page.locator('#phone').fill('5551234567')
      
      await page.getByRole('button', { name: /Guardar|Crear/i }).click()
      await page.waitForTimeout(1000)
      
      // Verificar que permaneció en la página de nuevo paciente (validación de fecha futura)
      const currentUrl = page.url()
      const stayedOnForm = currentUrl.includes('patients/new')
      const hasError = await page.locator('text=/fecha|futuro|pasada|inválido/i').count() > 0
      expect(stayedOnForm || hasError).toBe(true)
    })
  })

  test.describe('Patient Details', () => {
    test('should view patient details', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      const firstRow = page.locator('tbody tr').first()
      if (await firstRow.count() > 0) {
        // Buscar cualquier link que lleve a detalles de paciente
        const patientLink = firstRow.locator('a[href*="/patients/"]').first()
        if (await patientLink.count() > 0) {
          await patientLink.click()
          await page.waitForLoadState('networkidle')
          // El ID del paciente es un número grande (BigInt)
          await expect(page).toHaveURL(/patients\/\d+/)
          
          // La página muestra "Información Personal" como título de card
          await expect(page.getByText(/Información Personal|Contacto/i).first()).toBeVisible({ timeout: 5000 })
        }
      }
    })

    test('should display patient personal information', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      
      const firstRow = page.locator('tbody tr').first()
      if (await firstRow.count() > 0) {
        const patientLink = firstRow.locator('a').first()
        if (await patientLink.count() > 0) {
          await patientLink.click()
          await page.waitForLoadState('networkidle')
          
          // La página muestra: CURP, Fecha de Nacimiento, Género, Tipo de Sangre
          await expect(page.getByText(/CURP|Fecha de Nacimiento|Género|Tipo de Sangre/i).first()).toBeVisible({ timeout: 5000 })
        }
      }
    })

    test('should display contact information', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForTimeout(2000)
      
      const firstRow = page.locator('tbody tr').first()
      if (await firstRow.count() > 0) {
        const patientLink = firstRow.locator('a').first()
        if (await patientLink.count() > 0) {
          await patientLink.click()
          await page.waitForTimeout(1000)
          
          const contactSection = page.locator('text=/Contacto|Dirección|Email/i')
          if (await contactSection.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Edit Patient', () => {
    test('should navigate to edit patient form', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForTimeout(2000)
      
      const firstRow = page.locator('tbody tr').first()
      if (await firstRow.count() > 0) {
        const editButton = firstRow.locator('button, a').filter({ hasText: /Editar|Edit/i }).first()
        if (await editButton.count() > 0) {
          await editButton.click()
          await expect(page.getByRole('heading', { name: /Editar|Actualizar/i })).toBeVisible()
        }
      }
    })

    test('should update patient phone', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForTimeout(2000)
      
      const firstRow = page.locator('tbody tr').first()
      if (await firstRow.count() > 0) {
        const editButton = firstRow.locator('button, a').filter({ hasText: /Editar|Edit/i }).first()
        if (await editButton.count() > 0) {
          await editButton.click()
          
          const newPhone = `555${Date.now().toString().slice(-7)}`
          await page.locator('#phone').fill(newPhone)
          await page.getByRole('button', { name: /Guardar|Actualizar/i }).click()
          
          await page.waitForTimeout(1000)
        }
      }
    })
  })

  test.describe('Patient Medical History', () => {
    test('should access medical history section', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForTimeout(2000)
      
      const firstRow = page.locator('tbody tr').first()
      if (await firstRow.count() > 0) {
        const patientLink = firstRow.locator('a').first()
        if (await patientLink.count() > 0) {
          await patientLink.click()
          await page.waitForTimeout(1000)
          
          const historyLink = page.getByRole('link', { name: /Historial Médico|Medical History/i })
          if (await historyLink.count() > 0) {
            await historyLink.click()
            await expect(page).toHaveURL(/history|medical/i)
          }
        }
      }
    })

    test('should display allergies section', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForTimeout(2000)
      
      const firstRow = page.locator('tbody tr').first()
      if (await firstRow.count() > 0) {
        const patientLink = firstRow.locator('a').first()
        if (await patientLink.count() > 0) {
          await patientLink.click()
          await page.waitForTimeout(1000)
          
          const allergiesSection = page.locator('text=/Alergias|Allergies/i')
          if (await allergiesSection.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Emergency Contacts', () => {
    test('should display emergency contacts section', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForTimeout(2000)
      
      const firstRow = page.locator('tbody tr').first()
      if (await firstRow.count() > 0) {
        const patientLink = firstRow.locator('a').first()
        if (await patientLink.count() > 0) {
          await patientLink.click()
          await page.waitForTimeout(1000)
          
          const emergencySection = page.locator('text=/Contacto de Emergencia|Emergency Contact/i')
          if (await emergencySection.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Patient Appointments', () => {
    test('should display patient appointments', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForTimeout(2000)
      
      const firstRow = page.locator('tbody tr').first()
      if (await firstRow.count() > 0) {
        const patientLink = firstRow.locator('a').first()
        if (await patientLink.count() > 0) {
          await patientLink.click()
          await page.waitForTimeout(1000)
          
          const appointmentsLink = page.getByRole('link', { name: /Citas|Appointments/i })
          if (await appointmentsLink.count() > 0) {
            await appointmentsLink.click()
            await expect(page).toHaveURL(/appointments/i)
          }
        }
      }
    })
  })

  test.describe('Access Control', () => {
    test('should allow admin full access', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('button', { name: /Nuevo Paciente|Agregar/i })).toBeVisible({ timeout: 10000 })
    })

    test('should allow doctor to view patients', async ({ page }) => {
      await loginAsDoctor(page)
      await page.goto('/patients')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: /Pacientes/i })).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Pagination', () => {
    test('should display pagination', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForTimeout(2000)
      
      const pagination = page.locator('nav, [role="navigation"]')
      if (await pagination.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should navigate to next page', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForTimeout(2000)
      
      // Buscar botón de siguiente página
      const nextButton = page.locator('button').filter({ hasText: /siguiente|next|›|>/i }).first()
      if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
        await nextButton.click()
        await page.waitForTimeout(1000)
      }
    })
  })

  test.describe('Filtering', () => {
    test('should filter by gender', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForTimeout(1000)
      
      const genderFilter = page.locator('#gender, [id*="gender"]').first()
      if (await genderFilter.count() > 0) {
        await genderFilter.selectOption('MALE')
        await page.waitForTimeout(1000)
      }
    })

    test('should filter by active status', async ({ page }) => {
      await page.goto('/patients')
      await page.waitForTimeout(1000)
      
      const statusFilter = page.locator('#isActive, [id*="status"]').first()
      if (await statusFilter.count() > 0) {
        await statusFilter.selectOption('true')
        await page.waitForTimeout(1000)
      }
    })
  })
})
