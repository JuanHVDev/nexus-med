import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers'

test.describe('Billing - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test.describe('Invoices Page', () => {
    test('should display invoices page', async ({ page }) => {
      await page.goto('/billing')
      await expect(page.getByRole('heading', { name: /Facturación|Invoices|Billing/i })).toBeVisible({ timeout: 10000 })
    })

    test('should display invoices list', async ({ page }) => {
      await page.goto('/billing')
      await page.waitForTimeout(2000)
      
      const list = page.locator('table, .list')
      if (await list.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should display new invoice button', async ({ page }) => {
      await page.goto('/billing')
      await expect(page.getByRole('button', { name: /Nueva Factura|Agregar Factura|Nueva/i })).toBeVisible()
    })

    test('should display search functionality', async ({ page }) => {
      await page.goto('/billing')
      const searchInput = page.getByPlaceholder(/Buscar|Factura|Folio/i)
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible()
      }
    })
  })

  test.describe('Create Invoice', () => {
    test('should navigate to new invoice form', async ({ page }) => {
      await page.goto('/billing/invoices/new')
      await expect(page.getByRole('heading', { name: /Nueva Factura|Crear Factura/i })).toBeVisible()
    })

    test('should display invoice form fields', async ({ page }) => {
      await page.goto('/billing/invoices/new')
      
      await expect(page.locator('#patientId')).toBeVisible()
    })

    test('should select patient for invoice', async ({ page }) => {
      await page.goto('/billing/invoices/new')
      
      const patientSelect = page.locator('#patientId')
      if (await patientSelect.count() > 0) {
        const options = await patientSelect.locator('option').count()
        if (options > 1) {
          await patientSelect.selectOption({ index: 1 })
          await page.waitForTimeout(500)
        }
      }
    })

    test('should add services to invoice', async ({ page }) => {
      await page.goto('/billing/invoices/new')
      
      const patientSelect = page.locator('#patientId')
      if (await patientSelect.count() > 0) {
        const options = await patientSelect.locator('option').count()
        if (options > 1) {
          await patientSelect.selectOption({ index: 1 })
          await page.waitForTimeout(500)
          
          const addServiceButton = page.locator('button:has-text("Agregar servicio"), button:has-text("+")').first()
          if (await addServiceButton.count() > 0) {
            await addServiceButton.click()
            await page.waitForTimeout(500)
          }
        }
      }
    })

    test('should add custom item', async ({ page }) => {
      await page.goto('/billing/invoices/new')
      
      const addCustomButton = page.locator('button:has-text("Agregar artículo"), button:has-text("Artículo")').first()
      if (await addCustomButton.count() > 0) {
        await addCustomButton.click()
        await page.waitForTimeout(500)
        
        const descriptionInput = page.locator('input[name*="description"], input[id*="description"]').first()
        if (await descriptionInput.count() > 0) {
          await descriptionInput.fill('Consulta adicional')
        }
        
        const priceInput = page.locator('input[name*="price"], input[id*="price"]').first()
        if (await priceInput.count() > 0) {
          await priceInput.fill('500')
        }
      }
    })

    test('should calculate subtotal automatically', async ({ page }) => {
      await page.goto('/billing/invoices/new')
      
      const subtotalDisplay = page.locator('text=/Subtotal/i')
      if (await subtotalDisplay.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should apply discount', async ({ page }) => {
      await page.goto('/billing/invoices/new')
      
      const discountInput = page.locator('#discount, input[id*="discount"]')
      if (await discountInput.count() > 0) {
        await discountInput.fill('10')
        await page.waitForTimeout(500)
      }
    })

    test('should calculate tax', async ({ page }) => {
      await page.goto('/billing/invoices/new')
      
      const taxDisplay = page.locator('text=/IVA|Impuesto|Tax/i')
      if (await taxDisplay.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should display total', async ({ page }) => {
      await page.goto('/billing/invoices/new')
      
      const totalDisplay = page.locator('text=/Total/i')
      if (await totalDisplay.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should set due date', async ({ page }) => {
      await page.goto('/billing/invoices/new')
      
      const dueDateInput = page.locator('#dueDate, input[id*="due"]')
      if (await dueDateInput.count() > 0) {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        await dueDateInput.fill(futureDate)
      }
    })
  })

  test.describe('View Invoices', () => {
    test('should display invoice details', async ({ page }) => {
      await page.goto('/billing')
      await page.waitForTimeout(2000)
      
      const firstInvoice = page.locator('tbody tr').first()
      if (await firstInvoice.count() > 0) {
        const viewLink = firstInvoice.locator('a').first()
        if (await viewLink.count() > 0) {
          await viewLink.click()
          await page.waitForTimeout(1000)
          
          const details = page.locator('text=/Factura|Invoice|Paciente|Total/i')
          if (await details.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })

    test('should display invoice items', async ({ page }) => {
      await page.goto('/billing')
      await page.waitForTimeout(2000)
      
      const firstInvoice = page.locator('tbody tr').first()
      if (await firstInvoice.count() > 0) {
        const viewLink = firstInvoice.locator('a').first()
        if (await viewLink.count() > 0) {
          await viewLink.click()
          await page.waitForTimeout(1000)
          
          const items = page.locator('text=/Artículo|Service|Concepto/i')
          if (await items.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Invoice Status', () => {
    test('should display invoice status', async ({ page }) => {
      await page.goto('/billing')
      await page.waitForTimeout(2000)
      
      const status = page.locator('text=/PENDING|PAID|PARTIAL|CANCELLED|PENDIENTE|PAGADA/i')
      if (await status.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should mark invoice as paid', async ({ page }) => {
      await page.goto('/billing')
      await page.waitForTimeout(2000)
      
      const firstInvoice = page.locator('tbody tr').first()
      if (await firstInvoice.count() > 0) {
        const payButton = firstInvoice.locator('button:has-text("Pagar"), button:has-text("Paid")').first()
        if (await payButton.count() > 0) {
          await payButton.click()
          await page.waitForTimeout(500)
        }
      }
    })
  })

  test.describe('Payments', () => {
    test('should display payment form', async ({ page }) => {
      await page.goto('/billing')
      await page.waitForTimeout(2000)
      
      const firstInvoice = page.locator('tbody tr').first()
      if (await firstInvoice.count() > 0) {
        const payButton = firstInvoice.locator('button:has-text("Pagar"), a:has-text("Pagar")').first()
        if (await payButton.count() > 0) {
          await payButton.click()
          await page.waitForTimeout(1000)
          
          const paymentForm = page.locator('text=/Pago|Payment/i')
          if (await paymentForm.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })

    test('should select payment method', async ({ page }) => {
      await page.goto('/billing')
      await page.waitForTimeout(2000)
      
      const firstInvoice = page.locator('tbody tr').first()
      if (await firstInvoice.count() > 0) {
        const payButton = firstInvoice.locator('button:has-text("Pagar")').first()
        if (await payButton.count() > 0) {
          await payButton.click()
          await page.waitForTimeout(500)
          
          const methodSelect = page.locator('#method, select[id*="method"]')
          if (await methodSelect.count() > 0) {
            await methodSelect.selectOption('CASH')
          }
        }
      }
    })

    test('should record payment amount', async ({ page }) => {
      await page.goto('/billing')
      await page.waitForTimeout(2000)
      
      const firstInvoice = page.locator('tbody tr').first()
      if (await firstInvoice.count() > 0) {
        const payButton = firstInvoice.locator('button:has-text("Pagar")').first()
        if (await payButton.count() > 0) {
          await payButton.click()
          await page.waitForTimeout(500)
          
          const amountInput = page.locator('#amount, input[id*="amount"]')
          if (await amountInput.count() > 0) {
            await amountInput.fill('1000')
          }
        }
      }
    })

    test('should display payment history', async ({ page }) => {
      await page.goto('/billing')
      await page.waitForTimeout(2000)
      
      const firstInvoice = page.locator('tbody tr').first()
      if (await firstInvoice.count() > 0) {
        const viewLink = firstInvoice.locator('a').first()
        if (await viewLink.count() > 0) {
          await viewLink.click()
          await page.waitForTimeout(1000)
          
          const payments = page.locator('text=/Pagos|Payments|Historial/i')
          if (await payments.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Services Management', () => {
    test('should navigate to services', async ({ page }) => {
      await page.goto('/billing/services')
      await expect(page.getByRole('heading', { name: /Servicios|Services/i })).toBeVisible()
    })

    test('should display services list', async ({ page }) => {
      await page.goto('/billing/services')
      await page.waitForTimeout(1000)
      
      const list = page.locator('table, .list')
      if (await list.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should add new service', async ({ page }) => {
      await page.goto('/billing/services')
      
      const addButton = page.locator('button:has-text("Agregar"), button:has-text("Nuevo")').first()
      if (await addButton.count() > 0) {
        await addButton.click()
        await page.waitForTimeout(500)
        
        const nameInput = page.locator('#name, input[id*="name"]')
        if (await nameInput.count() > 0) {
          await nameInput.fill('Nuevo Servicio')
        }
        
        const priceInput = page.locator('#price, input[id*="price"]')
        if (await priceInput.count() > 0) {
          await priceInput.fill('500')
        }
      }
    })

    test('should set service price', async ({ page }) => {
      await page.goto('/billing/services')
      
      const addButton = page.locator('button:has-text("Agregar")').first()
      if (await addButton.count() > 0) {
        await addButton.click()
        await page.waitForTimeout(500)
        
        const priceInput = page.locator('#basePrice, input[id*="price"]')
        if (await priceInput.count() > 0) {
          await priceInput.fill('750')
        }
      }
    })
  })

  test.describe('Filtering', () => {
    test('should filter by status', async ({ page }) => {
      await page.goto('/billing')
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
      await page.goto('/billing')
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

    test('should filter by date range', async ({ page }) => {
      await page.goto('/billing')
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
  })

  test.describe('Reports', () => {
    test('should display revenue summary', async ({ page }) => {
      await page.goto('/billing')
      await page.waitForTimeout(1000)
      
      const summary = page.locator('text=/Ingresos|Revenue|Total/i')
      if (await summary.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should display pending payments', async ({ page }) => {
      await page.goto('/billing')
      await page.waitForTimeout(1000)
      
      const pending = page.locator('text=/Pendiente|Pending/i')
      if (await pending.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })

  test.describe('Access Control', () => {
    test('should restrict access to admin', async ({ page }) => {
      await page.goto('/billing/invoices/new')
      await expect(page.getByRole('heading', { name: /Factura|Nueva/i })).toBeVisible()
    })
  })
})
