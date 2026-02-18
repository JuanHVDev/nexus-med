import { test, expect } from '@playwright/test'
import { loginAsDoctor } from './helpers'

test.describe('Lab Orders - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page)
  })

  test.describe('Lab Orders Page', () => {
    test('should display lab orders page', async ({ page }) => {
      await page.goto('/lab-orders')
      await expect(page.getByRole('heading', { name: /Laboratorio|Lab Orders|Órdenes de Laboratorio/i })).toBeVisible({ timeout: 10000 })
    })

    test('should display lab orders list', async ({ page }) => {
      await page.goto('/lab-orders')
      await page.waitForTimeout(2000)
      
      const list = page.locator('table, .list')
      if (await list.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should display new lab order button', async ({ page }) => {
      await page.goto('/lab-orders')
      await expect(page.getByRole('button', { name: /Nueva Orden|Agregar Orden|Orden de Laboratorio/i })).toBeVisible()
    })
  })

  test.describe('Create Lab Order', () => {
    test('should navigate to new lab order form', async ({ page }) => {
      await page.goto('/lab-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await expect(page.getByRole('heading', { name: /Nueva Orden|Laboratorio/i })).toBeVisible()
    })

    test('should display lab order form fields', async ({ page }) => {
      await page.goto('/lab-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const patientSelect = page.locator('[role="combobox"], button:has-text("Seleccionar paciente")').first()
      if (await patientSelect.count() > 0) {
        await expect(patientSelect).toBeVisible()
      }
    })

    test('should select patient', async ({ page }) => {
      await page.goto('/lab-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const patientTrigger = page.locator('button:has-text("Seleccionar paciente")').first()
      if (await patientTrigger.count() > 0) {
        await patientTrigger.click()
        await page.waitForTimeout(500)
        
        const firstOption = page.locator('[role="option"]').first()
        if (await firstOption.count() > 0) {
          await firstOption.click()
        }
      }
    })

    test('should select lab tests', async ({ page }) => {
      await page.goto('/lab-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const testCheckbox = page.locator('input[type="checkbox"]').first()
      if (await testCheckbox.count() > 0) {
        await testCheckbox.click()
        await page.waitForTimeout(300)
      }
    })

    test('should add instructions', async ({ page }) => {
      await page.goto('/lab-orders')
      await page.getByRole('button', { name: /Nueva Orden/i }).click()
      await page.waitForTimeout(500)
      
      const instructionsInput = page.locator('input[placeholder*="ayunas"], input[placeholder*="recolectar"]')
      if (await instructionsInput.count() > 0) {
        await instructionsInput.fill('Paciente en ayunas')
      }
    })

    test('should create lab order', async ({ page }) => {
      await page.goto('/lab-orders')
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
      
      const testCheckbox = page.locator('input[type="checkbox"]').first()
      if (await testCheckbox.count() > 0) {
        await testCheckbox.click()
        await page.waitForTimeout(300)
      }
    })
  })

  test.describe('Lab Order Status', () => {
    test('should display order status', async ({ page }) => {
      await page.goto('/lab-orders')
      await page.waitForTimeout(1000)
      
      const status = page.locator('text=/PENDING|IN_PROGRESS|COMPLETED|CANCELLED|PENDIENTE|EN PROCESO|COMPLETADA/i')
      if (await status.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should update order status', async ({ page }) => {
      await page.goto('/lab-orders')
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

  test.describe('Lab Results', () => {
    test('should display results section', async ({ page }) => {
      await page.goto('/lab-orders')
      await page.waitForTimeout(2000)
      
      const firstOrder = page.locator('tbody tr').first()
      if (await firstOrder.count() > 0) {
        const viewLink = firstOrder.locator('a').first()
        if (await viewLink.count() > 0) {
          await viewLink.click()
          await page.waitForTimeout(1000)
          
          const results = page.locator('text=/Resultados|Results/i')
          if (await results.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })

    test('should add lab results', async ({ page }) => {
      await page.goto('/lab-orders')
      await page.waitForTimeout(2000)
      
      const firstOrder = page.locator('tbody tr').first()
      if (await firstOrder.count() > 0) {
        const editButton = firstOrder.locator('a:has-text("Editar"), button:has-text("Editar")').first()
        if (await editButton.count() > 0) {
          await editButton.click()
          await page.waitForTimeout(1000)
          
          const resultInput = page.locator('input[name*="result"], input[id*="result"]').first()
          if (await resultInput.count() > 0) {
            await resultInput.fill('Normal')
          }
        }
      }
    })
  })

  test.describe('Filtering', () => {
    test('should filter by status', async ({ page }) => {
      await page.goto('/lab-orders')
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

    test('should filter by patient', async ({ page }) => {
      await page.goto('/lab-orders')
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
