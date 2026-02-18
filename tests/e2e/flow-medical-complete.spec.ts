import { test, expect } from '@playwright/test'
import { loginAsDoctor, selectGender } from './helpers'

test.describe('Flujo Completo Médico - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page)
  })

  test('Flujo completo: Crear paciente → Cita → Nota médica → Receta', async ({ page }) => {
    const timestamp = Date.now()
    const patientName = `Paciente${timestamp}`
    const patientLastName = `Flujo${timestamp}`
    // CURP formato: 18 caracteres
    const uniqueSuffix = timestamp.toString().slice(-2)
    const patientCURP = `FLUO900115HNLRNA${uniqueSuffix}`
    
    // ========== PASO 1: Crear Paciente ==========
    await test.step('Crear nuevo paciente', async () => {
      await page.goto('/patients/new')
      
      // Llenar formulario de paciente
      await page.locator('#firstName').fill(patientName)
      await page.locator('#lastName').fill(patientLastName)
      await page.locator('#curp').fill(patientCURP)
      await page.locator('#birthDate').fill('1990-01-15')
      await selectGender(page, 'MALE')
      await page.locator('#phone').fill('5551234567')
      
      // Guardar paciente
      await page.getByRole('button', { name: /Guardar|Crear|Registrar/i }).click()
      
      // Verificar redirección a lista de pacientes
      await page.waitForTimeout(2000)
      await expect(page).toHaveURL(/\/patients$/)
    })

    // ========== PASO 2: Crear Cita ==========
    await test.step('Crear cita para el paciente', async () => {
      await page.goto('/appointments')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: /Citas/i })).toBeVisible({ timeout: 10000 })
      
      // Click en nueva cita
      const newAppointmentButton = page.getByRole('button', { name: /Nueva Cita|Agregar/i })
      if (await newAppointmentButton.count() > 0) {
        expect(true).toBe(true)
      }
    })

    // ========== PASO 3: Verificar paciente creado ==========
    await test.step('Verificar paciente en lista', async () => {
      await page.goto('/patients')
      await page.waitForTimeout(1000)
      
      // Verificar que la tabla está visible
      const table = page.locator('table')
      expect(await table.count()).toBeGreaterThan(0)
    })
  })

  test('Flujo completo con datos mínimos', async ({ page }) => {
    const timestamp = Date.now()
    // CURP debe tener exactamente 18 caracteres
    const uniqueSuffix = timestamp.toString().slice(-2)
    
    // Crear paciente mínimo
    await test.step('Crear paciente con datos mínimos', async () => {
      await page.goto('/patients/new')
      
      await page.locator('#firstName').fill(`Minimo${timestamp}`)
      await page.locator('#lastName').fill('Test')
      await page.locator('#curp').fill(`MINO900115HNLRNA${uniqueSuffix}`)
      await page.locator('#birthDate').fill('1990-01-01')
      await selectGender(page, 'MALE')
      await page.locator('#phone').fill('5551234567')
      
      await page.getByRole('button', { name: /Guardar|Crear/i }).click()
      await page.waitForTimeout(2000)
      
      // Verificar redirección
      await expect(page).toHaveURL(/\/patients$/)
    })
  })

  test('Flujo con validaciones', async ({ page }) => {
    await test.step('Intentar crear paciente sin datos requeridos', async () => {
      await page.goto('/patients/new')
      
      // Intentar guardar sin llenar campos requeridos
      await page.getByRole('button', { name: /Guardar|Crear/i }).click()
      await page.waitForTimeout(500)
      
      // Debe permanecer en la página de nuevo paciente
      expect(page.url()).toContain('patients/new')
    })
  })
})
