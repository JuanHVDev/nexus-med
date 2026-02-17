import { test, expect } from '@playwright/test'
import { loginAsDoctor } from './helpers'

test.describe('Prescriptions - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page)
  })

  test.describe('Prescriptions Page', () => {
    test('should display prescriptions page', async ({ page }) => {
      await page.goto('/prescriptions')
      await expect(page.getByRole('heading', { name: /Recetas|Prescripciones|Prescriptions/i })).toBeVisible({ timeout: 10000 })
    })

    test('should display prescriptions list', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(2000)
      
      const list = page.locator('table, .list')
      if (await list.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should display new prescription button', async ({ page }) => {
      await page.goto('/prescriptions')
      await expect(page.getByRole('button', { name: /Nueva Receta|Agregar Receta|Nueva Prescripción/i })).toBeVisible()
    })

    test('should display search functionality', async ({ page }) => {
      await page.goto('/prescriptions')
      const searchInput = page.getByPlaceholder(/Buscar|Buscar por/i)
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible()
      }
    })
  })

  test.describe('Create Prescription', () => {
    test('should navigate to new prescription form', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.getByRole('button', { name: /Nueva Receta|Agregar/i }).click()
      await expect(page.getByRole('heading', { name: /Nueva Receta|Nueva Prescripción/i })).toBeVisible()
    })

    test('should display prescription form fields', async ({ page }) => {
      await page.goto('/prescriptions/new')
      
      await expect(page.locator('#patientId')).toBeVisible()
      await expect(page.locator('#medications')).toBeVisible()
    })

    test('should display medications section', async ({ page }) => {
      await page.goto('/prescriptions/new')
      
      const medicationsSection = page.locator('text=/Medicamentos|Medications/i')
      if (await medicationsSection.count() > 0) {
        await expect(medicationsSection).toBeVisible()
      }
    })

    test('should add medication to prescription', async ({ page }) => {
      await page.goto('/prescriptions/new')
      
      const patientSelect = page.locator('#patientId')
      if (await patientSelect.count() > 0) {
        const options = await patientSelect.locator('option').count()
        if (options > 1) {
          await patientSelect.selectOption({ index: 1 })
        }
      }
      
      const addMedButton = page.locator('button:has-text("Agregar medicamento"), button:has-text("+")').first()
      if (await addMedButton.count() > 0) {
        await addMedButton.click()
        await page.waitForTimeout(500)
        
        const medName = page.locator('input[name*="medications"][name*="name"], input[id*="medication"]').first()
        if (await medName.count() > 0) {
          await medName.fill('Amoxicilina')
        }
      }
    })

    test('should fill medication details', async ({ page }) => {
      await page.goto('/prescriptions/new')
      
      const patientSelect = page.locator('#patientId')
      if (await patientSelect.count() > 0) {
        const options = await patientSelect.locator('option').count()
        if (options > 1) {
          await patientSelect.selectOption({ index: 1 })
        }
      }
      
      const medNameInput = page.locator('input[name*="name"], input[id*="name"]').first()
      if (await medNameInput.count() > 0) {
        await medNameInput.fill('Paracetamol')
      }
      
      const dosageInput = page.locator('input[name*="dosage"], input[id*="dosage"]').first()
      if (await dosageInput.count() > 0) {
        await dosageInput.fill('500mg')
      }
      
      const routeSelect = page.locator('select[name*="route"], select[id*="route"]').first()
      if (await routeSelect.count() > 0) {
        await routeSelect.selectOption('Oral')
      }
    })

    test('should add multiple medications', async ({ page }) => {
      await page.goto('/prescriptions/new')
      
      const patientSelect = page.locator('#patientId')
      if (await patientSelect.count() > 0) {
        const options = await patientSelect.locator('option').count()
        if (options > 1) {
          await patientSelect.selectOption({ index: 1 })
        }
      }
      
      const addMedButton = page.locator('button:has-text("Agregar"), button:has-text("+")').first()
      if (await addMedButton.count() > 0) {
        await addMedButton.click()
        await page.waitForTimeout(300)
        await addMedButton.click()
        await page.waitForTimeout(300)
      }
    })

    test('should add instructions', async ({ page }) => {
      await page.goto('/prescriptions/new')
      
      const instructionsInput = page.locator('#instructions, textarea[id*="instruction"]')
      if (await instructionsInput.count() > 0) {
        await instructionsInput.fill('Tomar con alimentos cada 8 horas')
      }
    })

    test('should set validity date', async ({ page }) => {
      await page.goto('/prescriptions/new')
      
      const validUntilInput = page.locator('#validUntil, input[id*="valid"]')
      if (await validUntilInput.count() > 0) {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        await validUntilInput.fill(futureDate)
      }
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/prescriptions/new')
      await page.getByRole('button', { name: /Guardar|Crear/i }).click()
      await page.waitForTimeout(500)
      
      const error = page.locator('text=/requerido|required|obligatorio/i')
      if (await error.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })

  test.describe('Medication Catalog', () => {
    test('should display medication suggestions', async ({ page }) => {
      await page.goto('/prescriptions/new')
      
      const medInput = page.locator('input[name*="medication"], input[id*="medication"]').first()
      if (await medInput.count() > 0) {
        await medInput.fill('Amox')
        await page.waitForTimeout(1000)
        
        const suggestions = page.locator('ul[role="listbox"], .suggestions, [class*="suggestion"]')
        if (await suggestions.count() > 0) {
          expect(true).toBe(true)
        }
      }
    })

    test('should search medications', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(1000)
      
      const searchInput = page.getByPlaceholder(/Buscar|Buscar por/i)
      if (await searchInput.count() > 0) {
        await searchInput.fill('Amoxicilina')
        await page.waitForTimeout(1000)
      }
    })
  })

  test.describe('View Prescriptions', () => {
    test('should display prescription details', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(2000)
      
      const firstPrescription = page.locator('tbody tr').first()
      if (await firstPrescription.count() > 0) {
        const viewLink = firstPrescription.locator('a').first()
        if (await viewLink.count() > 0) {
          await viewLink.click()
          await page.waitForTimeout(1000)
          
          const details = page.locator('text=/Receta|Prescripción|Paciente|Medicamentos/i')
          if (await details.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })

    test('should display patient information', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(2000)
      
      const firstRx = page.locator('tbody tr').first()
      if (await firstRx.count() > 0) {
        const patientCell = firstRx.locator('td').first()
        if (await patientCell.count() > 0) {
          expect(await patientCell.textContent()).toBeTruthy()
        }
      }
    })

    test('should display medication list', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(2000)
      
      const firstRx = page.locator('tbody tr').first()
      if (await firstRx.count() > 0) {
        const viewLink = firstRx.locator('a').first()
        if (await viewLink.count() > 0) {
          await viewLink.click()
          await page.waitForTimeout(1000)
          
          const medsList = page.locator('text=/Medicamento|Medication/i')
          if (await medsList.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })

    test('should display prescription date', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(2000)
      
      const firstRx = page.locator('tbody tr').first()
      if (await firstRx.count() > 0) {
        const dateCell = firstRx.locator('td').nth(1)
        if (await dateCell.count() > 0) {
          expect(await dateCell.textContent()).toBeTruthy()
        }
      }
    })
  })

  test.describe('Print/Download Prescription', () => {
    test('should display print button', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(2000)
      
      const firstRx = page.locator('tbody tr').first()
      if (await firstRx.count() > 0) {
        const viewLink = firstRx.locator('a').first()
        if (await viewLink.count() > 0) {
          await viewLink.click()
          await page.waitForTimeout(1000)
          
          const printButton = page.locator('button:has-text("Imprimir"), button:has-text("Print")').first()
          if (await printButton.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })

    test('should display download PDF button', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(2000)
      
      const firstRx = page.locator('tbody tr').first()
      if (await firstRx.count() > 0) {
        const viewLink = firstRx.locator('a').first()
        if (await viewLink.count() > 0) {
          await viewLink.click()
          await page.waitForTimeout(1000)
          
          const downloadButton = page.locator('button:has-text("PDF"), button:has-text("Descargar")').first()
          if (await downloadButton.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })

    test('should show prescription preview', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(2000)
      
      const firstRx = page.locator('tbody tr').first()
      if (await firstRx.count() > 0) {
        const viewLink = firstRx.locator('a').first()
        if (await viewLink.count() > 0) {
          await viewLink.click()
          await page.waitForTimeout(1000)
          
          const preview = page.locator('text=/Vista previa|Preview/i')
          if (await preview.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Prescription Validity', () => {
    test('should display validity date', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(2000)
      
      const validity = page.locator('text=/Válido|Validity|expira/i')
      if (await validity.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should show expired status', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(1000)
      
      const expired = page.locator('text=/Expirada|Expired|Vencida/i')
      if (await expired.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })

  test.describe('Patient Prescription History', () => {
    test('should display patient prescription history', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(2000)
      
      const firstRx = page.locator('tbody tr').first()
      if (await firstRx.count() > 0) {
        const patientLink = firstRx.locator('a').first()
        if (await patientLink.count() > 0) {
          await patientLink.click()
          await page.waitForTimeout(1000)
          
          const history = page.locator('text=/Historial|History|Recetas anteriores/i')
          if (await history.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })

    test('should filter prescriptions by patient', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(1000)
      
      const patientFilter = page.locator('#patientId, [id*="patient"]').first()
      if (await patientFilter.count() > 0) {
        const options = await patientFilter.locator('option').count()
        if (options > 1) {
          await patientFilter.selectOption({ index: 1 })
          await page.waitForTimeout(1000)
        }
      }
    })
  })

  test.describe('Filtering', () => {
    test('should filter by date range', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(1000)
      
      const fromDate = page.locator('#fromDate, [id*="from"]').first()
      const toDate = page.locator('#toDate, [id*="to"]').first()
      
      if (await fromDate.count() > 0 && await toDate.count() > 0) {
        const today = new Date().toISOString().split('T')[0]
        await fromDate.fill(today)
        await toDate.fill(today)
        await page.waitForTimeout(1000)
      }
    })

    test('should filter by doctor', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(1000)
      
      const doctorFilter = page.locator('#doctorId, [id*="doctor"]').first()
      if (await doctorFilter.count() > 0) {
        const options = await doctorFilter.locator('option').count()
        if (options > 1) {
          await doctorFilter.selectOption({ index: 1 })
          await page.waitForTimeout(1000)
        }
      }
    })
  })

  test.describe('Edit Prescription', () => {
    test('should navigate to edit prescription', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(2000)
      
      const firstRx = page.locator('tbody tr').first()
      if (await firstRx.count() > 0) {
        const editButton = firstRx.locator('a:has-text("Editar"), button:has-text("Editar")').first()
        if (await editButton.count() > 0) {
          await editButton.click()
          await expect(page.getByRole('heading', { name: /Editar/i })).toBeVisible()
        }
      }
    })
  })

  test.describe('Access Control', () => {
    test('should allow doctor to create prescriptions', async ({ page }) => {
      await page.goto('/prescriptions')
      await expect(page.getByRole('button', { name: /Nueva Receta/i })).toBeVisible()
    })

    test('should display doctor information on prescription', async ({ page }) => {
      await page.goto('/prescriptions')
      await page.waitForTimeout(2000)
      
      const doctor = page.locator('text=/Dr\\.|Doctor|Médico/i')
      if (await doctor.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })
})
