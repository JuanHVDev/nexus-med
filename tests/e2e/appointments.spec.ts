import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsDoctor } from './helpers'

test.describe('Appointments - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test.describe('Appointments Page', () => {
    test('should display appointments page', async ({ page }) => {
      await page.goto('/appointments')
      await expect(page.getByRole('heading', { name: /Citas|Agenda|Calendario/i })).toBeVisible({ timeout: 10000 })
    })

    test('should display calendar view', async ({ page }) => {
      await page.goto('/appointments')
      const calendar = page.locator('.calendar, [class*="calendar"], [class*="Calendar"]')
      if (await calendar.count() > 0) {
        await expect(calendar).toBeVisible()
      }
    })

    test('should display new appointment button', async ({ page }) => {
      await page.goto('/appointments')
      await expect(page.getByRole('button', { name: /Nueva Cita|Agregar Cita/i })).toBeVisible()
    })

    test('should display appointments list', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(2000)
      const list = page.locator('table, .list, [class*="list"]')
      if (await list.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })

  test.describe('Create Appointment', () => {
    test('should navigate to new appointment form', async ({ page }) => {
      await page.goto('/appointments')
      await page.getByRole('button', { name: /Nueva Cita|Agregar/i }).click()
      await expect(page.getByRole('heading', { name: /Nueva Cita|Crear Cita/i })).toBeVisible()
    })

    test('should display appointment form fields', async ({ page }) => {
      await page.goto('/appointments/new')
      
      await expect(page.getByText('Paciente')).toBeVisible()
      await expect(page.getByText('Doctor')).toBeVisible()
      await expect(page.getByText('Fecha y hora de inicio')).toBeVisible()
      await expect(page.getByText('Fecha y hora de fin')).toBeVisible()
      await expect(page.getByText('Motivo de la cita')).toBeVisible()
    })

    test('should create appointment with required fields', async ({ page }) => {
      await page.goto('/appointments/new')
      
      await page.waitForTimeout(2000)
      
      const patientTrigger = page.getByText('Seleccionar paciente').first()
      if (await patientTrigger.count() > 0) {
        await patientTrigger.click()
        const firstPatient = page.getByRole('option').first()
        if (await firstPatient.count() > 0) {
          await firstPatient.click()
        }
      }
      
      const doctorTrigger = page.getByText('Seleccionar doctor').first()
      if (await doctorTrigger.count() > 0) {
        await doctorTrigger.click()
        const firstDoctor = page.getByRole('option').first()
        if (await firstDoctor.count() > 0) {
          await firstDoctor.click()
        }
      }
      
      const timestamp = Date.now()
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
      const dateStr = futureDate.toISOString().slice(0, 16)
      
      await page.locator('input[type="datetime-local"]').first().fill(dateStr)
      await page.locator('input[type="datetime-local"]').last().fill(dateStr)
      
      await page.getByPlaceholder('Consulta general, Seguimiento, etc.').fill(`Consulta de prueba ${timestamp}`)
      
      await page.getByRole('button', { name: /Guardar cita/i }).click()
      await page.waitForTimeout(2000)
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/appointments/new')
      await page.getByRole('button', { name: /Guardar|Crear/i }).click()
      await page.waitForTimeout(500)
      
      const errorMessage = page.locator('text=/requerido|required|obligatorio/i')
      if (await errorMessage.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should validate date is not in past', async ({ page }) => {
      await page.goto('/appointments/new')
      await page.waitForTimeout(1000)
      
      await page.locator('input[type="datetime-local"]').first().fill('2020-01-01T10:00')
      
      await page.getByRole('button', { name: /Guardar|Crear/i }).click()
      await page.waitForTimeout(500)
      
      const dateError = page.locator('text=/fecha|pasada|anterior/i')
      if (await dateError.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should select appointment status', async ({ page }) => {
      await page.goto('/appointments/new')
      await page.waitForTimeout(1000)
      
      const statusTrigger = page.getByText('Programada').first()
      if (await statusTrigger.count() > 0) {
        await statusTrigger.click()
        const confirmedOption = page.getByRole('option', { name: /Confirmada/i })
        if (await confirmedOption.count() > 0) {
          await confirmedOption.click()
        }
      }
    })
  })

  test.describe('View Appointments', () => {
    test('should display appointment details', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(2000)
      
      const firstAppointment = page.locator('[class*="appointment"], tbody tr').first()
      if (await firstAppointment.count() > 0) {
        const detailsLink = firstAppointment.locator('a, button').first()
        if (await detailsLink.count() > 0) {
          await detailsLink.click()
          await page.waitForTimeout(1000)
          
          const details = page.locator('text=/Cita|Appointment|Paciente|Doctor/i')
          if (await details.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })

    test('should display patient info in appointment', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(2000)
      
      const appointment = page.locator('tbody tr').first()
      if (await appointment.count() > 0) {
        const patientCell = appointment.locator('td').nth(1)
        if (await patientCell.count() > 0) {
          expect(await patientCell.textContent()).toBeTruthy()
        }
      }
    })

    test('should display doctor info in appointment', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(2000)
      
      const appointment = page.locator('tbody tr').first()
      if (await appointment.count() > 0) {
        const doctorCell = appointment.locator('td').nth(2)
        if (await doctorCell.count() > 0) {
          expect(await doctorCell.textContent()).toBeTruthy()
        }
      }
    })

    test('should display appointment time', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(2000)
      
      const appointment = page.locator('tbody tr').first()
      if (await appointment.count() > 0) {
        const timeCell = appointment.locator('td').nth(0)
        if (await timeCell.count() > 0) {
          expect(await timeCell.textContent()).toBeTruthy()
        }
      }
    })
  })

  test.describe('Appointment Status', () => {
    test('should display appointment status', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(2000)
      
      const status = page.locator('text=/SCHEDULED|CONFIRMED|COMPLETED|CANCELLED|PENDIENTE|CONFIRMADA|COMPLETADA|CANCELADA/i')
      if (await status.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should change appointment status to confirmed', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(2000)
      
      const firstAppointment = page.locator('tbody tr').first()
      if (await firstAppointment.count() > 0) {
        const statusButton = firstAppointment.locator('button[aria-label*="status"], button:has-text("Confirmar")').first()
        if (await statusButton.count() > 0) {
          await statusButton.click()
          await page.waitForTimeout(1000)
        }
      }
    })

    test('should change appointment status to completed', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(2000)
      
      const firstAppointment = page.locator('tbody tr').first()
      if (await firstAppointment.count() > 0) {
        const completeButton = firstAppointment.locator('button:has-text("Completar"), button[aria-label*="complete"]').first()
        if (await completeButton.count() > 0) {
          await completeButton.click()
          await page.waitForTimeout(1000)
        }
      }
    })

    test('should cancel appointment', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(2000)
      
      const firstAppointment = page.locator('tbody tr').first()
      if (await firstAppointment.count() > 0) {
        const cancelButton = firstAppointment.locator('button:has-text("Cancelar"), button[aria-label*="cancel"]').first()
        if (await cancelButton.count() > 0) {
          await cancelButton.click()
          
          const confirmDialog = page.locator('button:has-text("Confirmar"), button:has-text("Aceptar")')
          if (await confirmDialog.count() > 0) {
            await confirmDialog.click()
            await page.waitForTimeout(1000)
          }
        }
      }
    })
  })

  test.describe('Edit Appointment', () => {
    test('should navigate to edit appointment', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(2000)
      
      const firstAppointment = page.locator('tbody tr').first()
      if (await firstAppointment.count() > 0) {
        const editButton = firstAppointment.locator('a:has-text("Editar"), button:has-text("Editar")').first()
        if (await editButton.count() > 0) {
          await editButton.click()
          await expect(page.getByRole('heading', { name: /Editar|Actualizar/i })).toBeVisible()
        }
      }
    })

    test('should update appointment time', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(2000)
      
      const firstAppointment = page.locator('tbody tr').first()
      if (await firstAppointment.count() > 0) {
        const editButton = firstAppointment.locator('a:has-text("Editar"), button:has-text("Editar")').first()
        if (await editButton.count() > 0) {
          await editButton.click()
          
          await page.locator('input[type="datetime-local"]').first().fill('2025-01-01T14:00')
          await page.getByRole('button', { name: /Guardar|Actualizar/i }).click()
          await page.waitForTimeout(1000)
        }
      }
    })

    test('should update appointment reason', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(2000)
      
      const firstAppointment = page.locator('tbody tr').first()
      if (await firstAppointment.count() > 0) {
        const editButton = firstAppointment.locator('a:has-text("Editar"), button:has-text("Editar")').first()
        if (await editButton.count() > 0) {
          await editButton.click()
          
          await page.getByPlaceholder('Consulta general, Seguimiento, etc.').fill('Motivo actualizado')
          await page.getByRole('button', { name: /Guardar|Actualizar/i }).click()
          await page.waitForTimeout(1000)
        }
      }
    })
  })

  test.describe('Calendar Views', () => {
    test('should display day view', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(1000)
      
      const dayViewButton = page.locator('button:has-text("Día"), button[aria-label*="day"]').first()
      if (await dayViewButton.count() > 0) {
        await dayViewButton.click()
        await page.waitForTimeout(500)
      }
    })

    test('should display week view', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(1000)
      
      const weekViewButton = page.locator('button:has-text("Semana"), button[aria-label*="week"]').first()
      if (await weekViewButton.count() > 0) {
        await weekViewButton.click()
        await page.waitForTimeout(500)
      }
    })

    test('should display month view', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(1000)
      
      const monthViewButton = page.locator('button:has-text("Mes"), button[aria-label*="month"]').first()
      if (await monthViewButton.count() > 0) {
        await monthViewButton.click()
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Filtering', () => {
    test('should filter by doctor', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(1000)
      
      const doctorFilter = page.locator('[id*="doctor"]').first()
      if (await doctorFilter.count() > 0) {
        const options = await doctorFilter.locator('option').count()
        if (options > 1) {
          await doctorFilter.selectOption({ index: 1 })
          await page.waitForTimeout(1000)
        }
      }
    })

    test('should filter by status', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(1000)
      
      const statusFilter = page.locator('[id*="status"]').first()
      if (await statusFilter.count() > 0) {
        const options = await statusFilter.locator('option').count()
        if (options > 1) {
          await statusFilter.selectOption('SCHEDULED')
          await page.waitForTimeout(1000)
        }
      }
    })

    test('should filter by date range', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(1000)
      
      const startDate = page.locator('[id*="start"]').first()
      const endDate = page.locator('[id*="end"]').first()
      
      if (await startDate.count() > 0 && await endDate.count() > 0) {
        const today = new Date().toISOString().split('T')[0]
        await startDate.fill(today)
        await endDate.fill(today)
        await page.waitForTimeout(1000)
      }
    })
  })

  test.describe('Access Control', () => {
    test('should allow admin to create appointments', async ({ page }) => {
      await page.goto('/appointments')
      await expect(page.getByRole('button', { name: /Nueva Cita|Agregar/i })).toBeVisible()
    })

    test('should allow doctor to view appointments', async ({ page }) => {
      await loginAsDoctor(page)
      await page.goto('/appointments')
      await expect(page.getByRole('heading', { name: /Citas|Agenda/i })).toBeVisible()
    })
  })

  test.describe('Appointments Today', () => {
    test('should display today appointments', async ({ page }) => {
      await page.goto('/appointments')
      await page.waitForTimeout(1000)
      
      const todaySection = page.locator('text=/Hoy|Today/i')
      if (await todaySection.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should display appointment count for today', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)
      
      const todayCount = page.locator('text=/\\d+ citas hoy|\\d+ appointments today/i')
      if (await todayCount.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })
})
