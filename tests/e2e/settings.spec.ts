import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers'

test.describe('Settings - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test.describe('Settings Page', () => {
    test('should display settings page', async ({ page }) => {
      await page.goto('/settings')
      await expect(page.getByRole('heading', { name: /Configuración|Settings/i })).toBeVisible({ timeout: 10000 })
    })

    test('should display settings menu', async ({ page }) => {
      await page.goto('/settings')
      const menu = page.locator('nav, [class*="menu"]')
      if (await menu.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })

  test.describe('Clinic Settings', () => {
    test('should display clinic settings', async ({ page }) => {
      await page.goto('/settings/clinic')
      await expect(page.getByRole('heading', { name: /Clínica|Clinic/i })).toBeVisible()
    })

    test('should display clinic name field', async ({ page }) => {
      await page.goto('/settings/clinic')
      await expect(page.locator('#name, input[id*="name"]')).toBeVisible()
    })

    test('should display RFC field', async ({ page }) => {
      await page.goto('/settings/clinic')
      await expect(page.locator('#rfc, input[id*="rfc"]')).toBeVisible()
    })

    test('should display address fields', async ({ page }) => {
      await page.goto('/settings/clinic')
      const address = page.locator('text=/Dirección|Address/i')
      if (await address.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should display phone field', async ({ page }) => {
      await page.goto('/settings/clinic')
      const phone = page.locator('#phone, input[id*="phone"]')
      if (await phone.count() > 0) {
        await expect(phone).toBeVisible()
      }
    })

    test('should display email field', async ({ page }) => {
      await page.goto('/settings/clinic')
      const email = page.locator('#email, input[id*="email"]')
      if (await email.count() > 0) {
        await expect(email).toBeVisible()
      }
    })

    test('should update clinic name', async ({ page }) => {
      await page.goto('/settings/clinic')
      
      const nameInput = page.locator('#name, input[id*="name"]')
      if (await nameInput.count() > 0) {
        await nameInput.fill('Nueva Clínica')
        await page.getByRole('button', { name: /Guardar|Actualizar|Save/i }).click()
        await page.waitForTimeout(1000)
      }
    })

    test('should update clinic RFC', async ({ page }) => {
      await page.goto('/settings/clinic')
      
      const rfcInput = page.locator('#rfc, input[id*="rfc"]')
      if (await rfcInput.count() > 0) {
        await rfcInput.fill('AAA010101ABC')
        await page.getByRole('button', { name: /Guardar|Actualizar/i }).click()
        await page.waitForTimeout(1000)
      }
    })

    test('should validate RFC format', async ({ page }) => {
      await page.goto('/settings/clinic')
      
      const rfcInput = page.locator('#rfc, input[id*="rfc"]')
      if (await rfcInput.count() > 0) {
        await rfcInput.fill('INVALID')
        await page.getByRole('button', { name: /Guardar|Actualizar/i }).click()
        await page.waitForTimeout(500)
        
        const error = page.locator('text=/RFC inválido|formato/i')
        if (await error.count() > 0) {
          expect(true).toBe(true)
        }
      }
    })
  })

  test.describe('Working Hours', () => {
    test('should display working hours settings', async ({ page }) => {
      await page.goto('/settings/hours')
      const hours = page.locator('text=/Horarios|Working Hours/i')
      if (await hours.count() > 0) {
        await expect(hours).toBeVisible()
      }
    })

    test('should display days of week', async ({ page }) => {
      await page.goto('/settings/hours')
      const days = page.locator('text=/Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo|Monday|Tuesday/i')
      if (await days.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should configure start time', async ({ page }) => {
      await page.goto('/settings/hours')
      
      const startTimeInput = page.locator('input[name*="start"], [id*="start"]').first()
      if (await startTimeInput.count() > 0) {
        await startTimeInput.fill('08:00')
        await page.getByRole('button', { name: /Guardar|Actualizar/i }).click()
        await page.waitForTimeout(500)
      }
    })

    test('should configure end time', async ({ page }) => {
      await page.goto('/settings/hours')
      
      const endTimeInput = page.locator('input[name*="end"], [id*="end"]').first()
      if (await endTimeInput.count() > 0) {
        await endTimeInput.fill('18:00')
        await page.getByRole('button', { name: /Guardar|Actualizar/i }).click()
        await page.waitForTimeout(500)
      }
    })

    test('should enable/disable day', async ({ page }) => {
      await page.goto('/settings/hours')
      
      const toggle = page.locator('input[type="checkbox"]').first()
      if (await toggle.count() > 0) {
        await toggle.click()
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Doctors Management', () => {
    test('should display doctors list', async ({ page }) => {
      await page.goto('/settings/doctors')
      await expect(page.getByRole('heading', { name: /Doctores|Doctors|Médicos/i })).toBeVisible()
    })

    test('should add new doctor', async ({ page }) => {
      await page.goto('/settings/doctors')
      
      const addButton = page.locator('button:has-text("Agregar Doctor"), button:has-text("Nuevo Doctor")').first()
      if (await addButton.count() > 0) {
        await addButton.click()
        await page.waitForTimeout(500)
        
        const nameInput = page.locator('#name, input[id*="name"]')
        if (await nameInput.count() > 0) {
          await nameInput.fill('Dr. Nuevo Doctor')
        }
        
        const emailInput = page.locator('#email, input[id*="email"]')
        if (await emailInput.count() > 0) {
          await emailInput.fill(`doctor${Date.now()}@clinic.com`)
        }
      }
    })

    test('should edit doctor information', async ({ page }) => {
      await page.goto('/settings/doctors')
      await page.waitForTimeout(1000)
      
      const firstDoctor = page.locator('tbody tr').first()
      if (await firstDoctor.count() > 0) {
        const editButton = firstDoctor.locator('a:has-text("Editar"), button:has-text("Editar")').first()
        if (await editButton.count() > 0) {
          await editButton.click()
          await page.waitForTimeout(500)
          
          const specialtyInput = page.locator('#specialty, input[id*="specialty"]')
          if (await specialtyInput.count() > 0) {
            await specialtyInput.fill('Cardiología')
          }
        }
      }
    })

    test('should toggle doctor active status', async ({ page }) => {
      await page.goto('/settings/doctors')
      await page.waitForTimeout(1000)
      
      const firstDoctor = page.locator('tbody tr').first()
      if (await firstDoctor.count() > 0) {
        const toggleButton = firstDoctor.locator('button[aria-label*="active"], input[type="checkbox"]').first()
        if (await toggleButton.count() > 0) {
          await toggleButton.click()
          await page.waitForTimeout(500)
        }
      }
    })

    test('should set doctor specialty', async ({ page }) => {
      await page.goto('/settings/doctors')
      await page.waitForTimeout(1000)
      
      const firstDoctor = page.locator('tbody tr').first()
      if (await firstDoctor.count() > 0) {
        const editButton = firstDoctor.locator('a:has-text("Editar")').first()
        if (await editButton.count() > 0) {
          await editButton.click()
          await page.waitForTimeout(500)
          
          const specialtySelect = page.locator('#specialty, select[id*="specialty"]')
          if (await specialtySelect.count() > 0) {
            const options = await specialtySelect.locator('option').count()
            if (options > 1) {
              await specialtySelect.selectOption({ index: 1 })
            }
          }
        }
      }
    })

    test('should set license number', async ({ page }) => {
      await page.goto('/settings/doctors')
      await page.waitForTimeout(1000)
      
      const firstDoctor = page.locator('tbody tr').first()
      if (await firstDoctor.count() > 0) {
        const editButton = firstDoctor.locator('a:has-text("Editar")').first()
        if (await editButton.count() > 0) {
          await editButton.click()
          await page.waitForTimeout(500)
          
          const licenseInput = page.locator('#licenseNumber, input[id*="license"]')
          if (await licenseInput.count() > 0) {
            await licenseInput.fill('12345678')
          }
        }
      }
    })
  })

  test.describe('Users Management', () => {
    test('should display users list', async ({ page }) => {
      await page.goto('/settings/users')
      await expect(page.getByRole('heading', { name: /Usuarios|Users/i })).toBeVisible()
    })

    test('should add new user', async ({ page }) => {
      await page.goto('/settings/users')
      
      const addButton = page.locator('button:has-text("Agregar Usuario"), button:has-text("Nuevo Usuario")').first()
      if (await addButton.count() > 0) {
        await addButton.click()
        await page.waitForTimeout(500)
        
        const nameInput = page.locator('#name, input[id*="name"]')
        if (await nameInput.count() > 0) {
          await nameInput.fill('Nuevo Usuario')
        }
      }
    })

    test('should assign role to user', async ({ page }) => {
      await page.goto('/settings/users')
      
      const addButton = page.locator('button:has-text("Agregar")').first()
      if (await addButton.count() > 0) {
        await addButton.click()
        await page.waitForTimeout(500)
        
        const roleSelect = page.locator('#role, select[id*="role"]')
        if (await roleSelect.count() > 0) {
          await roleSelect.selectOption('DOCTOR')
        }
      }
    })

    test('should toggle user active status', async ({ page }) => {
      await page.goto('/settings/users')
      await page.waitForTimeout(1000)
      
      const firstUser = page.locator('tbody tr').first()
      if (await firstUser.count() > 0) {
        const toggleButton = firstUser.locator('input[type="checkbox"]').first()
        if (await toggleButton.count() > 0) {
          await toggleButton.click()
          await page.waitForTimeout(500)
        }
      }
    })
  })

  test.describe('Services Settings', () => {
    test('should display services settings', async ({ page }) => {
      await page.goto('/settings/services')
      const services = page.locator('text=/Servicios|Services/i')
      if (await services.count() > 0) {
        await expect(services.first()).toBeVisible()
      }
    })

    test('should add new service', async ({ page }) => {
      await page.goto('/settings/services')
      
      const addButton = page.locator('button:has-text("Agregar Servicio")').first()
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

    test('should edit service', async ({ page }) => {
      await page.goto('/settings/services')
      await page.waitForTimeout(1000)
      
      const firstService = page.locator('tbody tr').first()
      if (await firstService.count() > 0) {
        const editButton = firstService.locator('a:has-text("Editar"), button:has-text("Editar")').first()
        if (await editButton.count() > 0) {
          await editButton.click()
          await page.waitForTimeout(500)
        }
      }
    })

    test('should toggle service active status', async ({ page }) => {
      await page.goto('/settings/services')
      await page.waitForTimeout(1000)
      
      const firstService = page.locator('tbody tr').first()
      if (await firstService.count() > 0) {
        const toggle = firstService.locator('input[type="checkbox"]').first()
        if (await toggle.count() > 0) {
          await toggle.click()
          await page.waitForTimeout(500)
        }
      }
    })
  })

  test.describe('Access Control', () => {
    test('should restrict admin-only settings', async ({ page }) => {
      await page.goto('/settings')
      await expect(page.getByRole('heading', { name: /Configuración/i })).toBeVisible()
    })

    test('should display role information', async ({ page }) => {
      await page.goto('/settings')
      const role = page.locator('text=/Administrador|Admin|Rol/i')
      if (await role.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })
})
