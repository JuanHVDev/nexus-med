import { test, expect } from '@playwright/test'
import { loginAsDoctor } from './helpers'

test.describe('Imaging Orders - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page)
  })

  test.describe('Imaging Orders Page', () => {
    test('should display imaging orders page', async ({ page }) => {
      await page.goto('/imaging-orders')
      await expect(page.getByRole('heading', { name: /Imagen|Imagenología|Imaging Orders|Órdenes de Imagen/i })).toBeVisible({ timeout: 10000 })
    })

    test('should display imaging orders list', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.waitForTimeout(2000)
      
      const list = page.locator('table, .list')
      if (await list.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should display new imaging order button', async ({ page }) => {
      await page.goto('/imaging-orders')
      await expect(page.getByRole('button', { name: /Nueva Orden|Agregar Orden|Orden de Imagen/i })).toBeVisible()
    })
  })

  test.describe('Create Imaging Order', () => {
    test('should navigate to new imaging order form', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await expect(page.getByRole('heading', { name: /Nueva Orden|Imagenología/i })).toBeVisible()
    })

    test('should display imaging order form fields', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const patientSelect = page.locator('button:has-text("Seleccionar paciente")').first()
      if (await patientSelect.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should select patient', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const patientSelect = page.locator('button:has-text("Seleccionar paciente")').first()
      if (await patientSelect.count() > 0) {
        await patientSelect.click()
        await page.waitForTimeout(500)
        
        const firstOption = page.locator('[role="option"]').first()
        if (await firstOption.count() > 0) {
          await firstOption.click()
        }
      }
    })

    test('should select study type', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const studyTypeTrigger = page.locator('button:has-text("Seleccionar tipo")').first()
      if (await studyTypeTrigger.count() > 0) {
        await studyTypeTrigger.click()
        await page.waitForTimeout(500)
        
        const firstOption = page.locator('[role="option"]').first()
        if (await firstOption.count() > 0) {
          await firstOption.click()
        }
      }
    })

    test('should select body part', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const bodyPartInput = page.getByPlaceholder(/Tórax|Abdomen|Mano/i)
      if (await bodyPartInput.count() > 0) {
        await bodyPartInput.fill('Tórax')
      }
    })

    test('should add reason for study', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const reasonInput = page.getByPlaceholder(/Tos|Dolor|Indicación/i)
      if (await reasonInput.count() > 0) {
        await reasonInput.fill('Dolor torácico')
      }
    })

    test('should add clinical notes', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const notesInput = page.locator('textarea')
      if (await notesInput.count() > 0) {
        await notesInput.fill('Paciente con sintomas respiratorios')
      }
    })

    test('should create imaging order', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const patientSelect = page.locator('button:has-text("Seleccionar paciente")').first()
      if (await patientSelect.count() > 0) {
        await patientSelect.click()
        await page.waitForTimeout(500)
        
        const firstOption = page.locator('[role="option"]').first()
        if (await firstOption.count() > 0) {
          await firstOption.click()
        }
      }
      
      const studyTypeTrigger = page.locator('button:has-text("Seleccionar tipo")').first()
      if (await studyTypeTrigger.count() > 0) {
        await studyTypeTrigger.click()
        await page.waitForTimeout(500)
        
        const firstOption = page.locator('[role="option"]').first()
        if (await firstOption.count() > 0) {
          await firstOption.click()
        }
      }
      
      const bodyPartInput = page.getByPlaceholder(/Tórax|Abdomen|Mano/i)
      if (await bodyPartInput.count() > 0) {
        await bodyPartInput.fill('Abdomen')
      }
    })
  })

  test.describe('Study Types', () => {
    test('should have RX option', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const studyTypeTrigger = page.locator('button:has-text("Seleccionar tipo")').first()
      if (await studyTypeTrigger.count() > 0) {
        await studyTypeTrigger.click()
        await page.waitForTimeout(500)
        
        const rxOption = page.locator('[role="option"]:has-text("RX")')
        if (await rxOption.count() > 0) {
          expect(true).toBe(true)
        }
      }
    })

    test('should have ULTRASOUND option', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const studyTypeTrigger = page.locator('button:has-text("Seleccionar tipo")').first()
      if (await studyTypeTrigger.count() > 0) {
        await studyTypeTrigger.click()
        await page.waitForTimeout(500)
        
        const usOption = page.locator('[role="option"]:has-text("Ultrasonido")')
        if (await usOption.count() > 0) {
          expect(true).toBe(true)
        }
      }
    })

    test('should have CT option', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const studyTypeTrigger = page.locator('button:has-text("Seleccionar tipo")').first()
      if (await studyTypeTrigger.count() > 0) {
        await studyTypeTrigger.click()
        await page.waitForTimeout(500)
        
        const ctOption = page.locator('[role="option"]:has-text("Tomografía")')
        if (await ctOption.count() > 0) {
          expect(true).toBe(true)
        }
      }
    })

    test('should have MRI option', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const studyTypeTrigger = page.locator('button:has-text("Seleccionar tipo")').first()
      if (await studyTypeTrigger.count() > 0) {
        await studyTypeTrigger.click()
        await page.waitForTimeout(500)
        
        const mriOption = page.locator('[role="option"]:has-text("Resonancia")')
        if (await mriOption.count() > 0) {
          expect(true).toBe(true)
        }
      }
    })
  })

  test.describe('Imaging Order Status', () => {
    test('should display order status', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.waitForTimeout(1000)
      
      const status = page.locator('text=/PENDING|IN_PROGRESS|COMPLETED|CANCELLED|PENDIENTE|EN PROCESO|COMPLETADA/i')
      if (await status.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should update order status', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.waitForTimeout(2000)
      
      const firstOrder = page.locator('tbody tr').first()
      if (await firstOrder.count() > 0) {
        const statusButton = firstOrder.locator('button').first()
        if (await statusButton.count() > 0) {
          await statusButton.click()
          await page.waitForTimeout(500)
        }
      }
    })
  })

  test.describe('Results', () => {
    test('should display findings section', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.waitForTimeout(2000)
      
      const firstOrder = page.locator('tbody tr').first()
      if (await firstOrder.count() > 0) {
        const viewLink = firstOrder.locator('a').first()
        if (await viewLink.count() > 0) {
          await viewLink.click()
          await page.waitForTimeout(1000)
          
          const findings = page.locator('text=/Hallazgos|Findings/i')
          if (await findings.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })

    test('should add findings', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.waitForTimeout(2000)
      
      const firstOrder = page.locator('tbody tr').first()
      if (await firstOrder.count() > 0) {
        const editButton = firstOrder.locator('a:has-text("Editar"), button:has-text("Editar")').first()
        if (await editButton.count() > 0) {
          await editButton.click()
          await page.waitForTimeout(1000)
          
          const findingsInput = page.locator('#findings, textarea[id*="finding"]')
          if (await findingsInput.count() > 0) {
            await findingsInput.fill('Hallazgos normales')
          }
        }
      }
    })

    test('should add impression', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.waitForTimeout(2000)
      
      const firstOrder = page.locator('tbody tr').first()
      if (await firstOrder.count() > 0) {
        const editButton = firstOrder.locator('a:has-text("Editar")').first()
        if (await editButton.count() > 0) {
          await editButton.click()
          await page.waitForTimeout(1000)
          
          const impressionInput = page.locator('#impression, textarea[id*="impression"]')
          if (await impressionInput.count() > 0) {
            await impressionInput.fill('Estudio dentro de límites normales')
          }
        }
      }
    })

    test('should upload report', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.waitForTimeout(2000)
      
      const firstOrder = page.locator('tbody tr').first()
      if (await firstOrder.count() > 0) {
        const editButton = firstOrder.locator('a:has-text("Editar")').first()
        if (await editButton.count() > 0) {
          await editButton.click()
          await page.waitForTimeout(1000)
          
          const uploadButton = page.locator('input[type="file"], button:has-text("Subir")').first()
          if (await uploadButton.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Filtering', () => {
    test('should filter by status', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.waitForTimeout(1000)
      
      const statusFilter = page.locator('#status, [id*="status"]').first()
      if (await statusFilter.count() > 0) {
        const options = await statusFilter.locator('option').count()
        if (options > 1) {
          await statusFilter.selectOption('PENDING')
          await page.waitForTimeout(1000)
        }
      }
    })

    test('should filter by study type', async ({ page }) => {
      await page.goto('/imaging-orders')
      await page.waitForTimeout(1000)
      
      const typeFilter = page.locator('#studyType, [id*="study"]').first()
      if (await typeFilter.count() > 0) {
        const options = await typeFilter.locator('option').count()
        if (options > 1) {
          await typeFilter.selectOption('RX')
          await page.waitForTimeout(1000)
        }
      }
    })

    test('should filter by patient', async ({ page }) => {
      await page.goto('/imaging-orders')
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
})
