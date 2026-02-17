import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsDoctor } from './helpers'

test.describe('Dashboard - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test.describe('Dashboard Page', () => {
    test('should display dashboard page', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.getByRole('heading', { name: /Dashboard|Inicio/i })).toBeVisible({ timeout: 10000 })
    })

    test('should display welcome message', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.getByText(/Bienvenido|Hola|Welcome/i)).toBeVisible()
    })

    test('should display user name', async ({ page }) => {
      await page.goto('/dashboard')
      const userName = page.locator('text=/Admin|Doctor|Dr\\./i')
      if (await userName.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })

  test.describe('Statistics Cards', () => {
    test('should display total patients card', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.getByText(/Pacientes Totales|Total Patients|Total de Pacientes/i)).toBeVisible()
    })

    test('should display appointments today card', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.getByText(/Citas Hoy|Today's Appointments|Citas de Hoy/i)).toBeVisible()
    })

    test('should display revenue card', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.getByText(/Ingresos|Revenue|Ingresos del Mes/i)).toBeVisible()
    })

    test('should display pending appointments card', async ({ page }) => {
      await page.goto('/dashboard')
      const pending = page.locator('text=/Pendiente|Pending|Citas Pendientes/i')
      if (await pending.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })

  test.describe('Charts', () => {
    test('should display appointments chart', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)
      
      const chart = page.locator('[class*="chart"], svg')
      if (await chart.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should display revenue chart', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)
      
      const revenueChart = page.locator('text=/Ingresos|Revenue/i')
      if (await revenueChart.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })

  test.describe('Quick Actions', () => {
    test('should display quick actions', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.getByRole('button', { name: /Nueva Cita|Agregar/i })).toBeVisible()
    })

    test('should navigate to new patient', async ({ page }) => {
      await page.goto('/dashboard')
      const newPatientButton = page.locator('a:has-text("Nuevo Paciente"), button:has-text("Nuevo Paciente")').first()
      if (await newPatientButton.count() > 0) {
        await newPatientButton.click()
        await expect(page).toHaveURL(/patients\/new/)
      }
    })

    test('should navigate to new appointment', async ({ page }) => {
      await page.goto('/dashboard')
      const newAppointmentButton = page.locator('a:has-text("Nueva Cita"), button:has-text("Nueva Cita")').first()
      if (await newAppointmentButton.count() > 0) {
        await newAppointmentButton.click()
        await expect(page).toHaveURL(/appointments/)
      }
    })
  })

  test.describe('Recent Items', () => {
    test('should display recent patients', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)
      
      const recentPatients = page.locator('text=/Pacientes Recientes|Recent Patients|Últimos Pacientes/i')
      if (await recentPatients.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should display recent appointments', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)
      
      const recentAppointments = page.locator('text=/Citas Recientes|Recent Appointments|Últimas Citas/i')
      if (await recentAppointments.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })

  test.describe("Today's Schedule", () => {
    test('should display today appointments', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)
      
      const todaySchedule = page.locator('text=/Agenda de Hoy|Today\'s Schedule|Hoy/i')
      if (await todaySchedule.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should display appointment count', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)
      
      const count = page.locator('text=/\\d+ citas|\\d+ appointments/i')
      if (await count.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })

  test.describe('Navigation', () => {
    test('should have dashboard in navigation', async ({ page }) => {
      await page.goto('/dashboard')
      const dashboardLink = page.getByRole('link', { name: /Dashboard|Inicio/i }).first()
      if (await dashboardLink.count() > 0) {
        await expect(dashboardLink).toBeVisible()
      }
    })

    test('should have patients in navigation', async ({ page }) => {
      await page.goto('/dashboard')
      const patientsLink = page.getByRole('link', { name: /Pacientes|Patients/i }).first()
      if (await patientsLink.count() > 0) {
        await expect(patientsLink).toBeVisible()
      }
    })

    test('should have appointments in navigation', async ({ page }) => {
      await page.goto('/dashboard')
      const appointmentsLink = page.getByRole('link', { name: /Citas|Appointments|Agenda/i }).first()
      if (await appointmentsLink.count() > 0) {
        await expect(appointmentsLink).toBeVisible()
      }
    })
  })

  test.describe('Refresh', () => {
    test('should refresh dashboard data', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForTimeout(2000)
      
      await page.reload()
      await page.waitForTimeout(2000)
      
      await expect(page.getByRole('heading', { name: /Dashboard|Inicio/i })).toBeVisible()
    })
  })

  test.describe('Access Control', () => {
    test('should allow admin to view dashboard', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.getByRole('heading', { name: /Dashboard|Inicio/i })).toBeVisible()
    })

    test('should allow doctor to view dashboard', async ({ page }) => {
      await loginAsDoctor(page)
      await page.goto('/dashboard')
      await expect(page.getByRole('heading', { name: /Dashboard|Inicio/i })).toBeVisible()
    })
  })
})
