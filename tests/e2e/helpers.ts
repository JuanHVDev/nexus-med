import { expect, type Page } from '@playwright/test'

export async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.locator('#email').fill('admin@clinic.com')
  await page.locator('#password').fill('password123')
  await page.getByRole('button', { name: /Iniciar Sesión|Login|Sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 20000 })
  await expect(page.getByText('HC Gestor')).toBeVisible({ timeout: 10000 })
}

export async function loginAsDoctor(page: Page) {
  // Primero verificar si ya hay una sesión activa y cerrarla
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  
  // Si ya estamos en dashboard, necesitamos cerrar sesión primero
  const currentUrl = page.url()
  if (currentUrl.includes('dashboard') || currentUrl.includes('patients')) {
    // Click en el menú de usuario para cerrar sesión
    await page.getByRole('button', { name: /Menú de usuario|avatar/i }).click()
    await page.getByRole('menuitem', { name: /Cerrar Sesión|Salir|Logout/i }).click()
    await page.waitForURL('**/login', { timeout: 10000 })
  }
  
  await page.locator('#email').fill('doctor@clinic.com')
  await page.locator('#password').fill('password123')
  await page.getByRole('button', { name: /Iniciar Sesión|Login|Sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 20000 })
  await expect(page.getByText('HC Gestor')).toBeVisible({ timeout: 10000 })
}

export async function loginAsReceptionist(page: Page) {
  await page.goto('/login')
  await page.locator('#email').fill('receptionist@clinic.com')
  await page.locator('#password').fill('password123')
  await page.getByRole('button', { name: /Iniciar Sesión|Login|Sign in/i }).click()
  await page.waitForURL('**/dashboard', { timeout: 20000 })
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: /Cerrar Sesión|Salir|Logout/i }).click()
  await expect(page).toHaveURL(/login|signin/)
}

export async function selectGender(page: Page, gender: 'MALE' | 'FEMALE' | 'OTHER') {
  // El campo gender es un combobox de shadcn/ui, no un select nativo
  await page.locator('#gender').click()
  const genderText = gender === 'MALE' ? 'Masculino' : gender === 'FEMALE' ? 'Femenino' : 'Otro'
  await page.getByRole('option', { name: genderText }).click()
}

export async function createTestPatient(page: Page, options?: {
  firstName?: string
  lastName?: string
  curp?: string
  birthDate?: string
  gender?: string
  phone?: string
}) {
  const timestamp = Date.now()
  // CURP formato: 4 letras + 6 dígitos + 1 letra + 2 letras + 3 letras + 2 alfanuméricos = 18 caracteres
  const uniqueSuffix = timestamp.toString().slice(-2)
  const defaultCurp = `TEST900115HNLRNA${uniqueSuffix}` // 18 caracteres
  
  const patient = {
    firstName: options?.firstName || `Paciente${timestamp}`,
    lastName: options?.lastName || 'Test',
    curp: options?.curp || defaultCurp,
    birthDate: options?.birthDate || '1990-01-15',
    gender: options?.gender || 'MALE',
    phone: options?.phone || '5551234567',
  }

  await page.goto('/patients/new')
  await page.locator('#firstName').fill(patient.firstName)
  await page.locator('#lastName').fill(patient.lastName)
  await page.locator('#curp').fill(patient.curp)
  await page.locator('#birthDate').fill(patient.birthDate)
  await selectGender(page, patient.gender as 'MALE' | 'FEMALE' | 'OTHER')
  await page.locator('#phone').fill(patient.phone)

  await page.getByRole('button', { name: /Guardar|Crear|Registrar/i }).click()

  return patient
}

export async function createTestAppointment(page: Page, options?: {
  patientId?: string
  doctorId?: string
  date?: string
  time?: string
  reason?: string
}) {
  const timestamp = Date.now()
  const appointment = {
    reason: options?.reason || `Cita de prueba ${timestamp}`,
    date: options?.date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: options?.time || '10:00',
  }

  await page.goto('/appointments')
  await page.getByRole('button', { name: /Nueva Cita|Agregar/i }).click()

  if (options?.patientId) {
    await page.locator('#patientId').selectOption(options.patientId)
  }

  if (options?.doctorId) {
    await page.locator('#doctorId').selectOption(options.doctorId)
  }

  await page.locator('#reason').fill(appointment.reason)
  await page.locator('#date').fill(appointment.date)
  await page.locator('#time').fill(appointment.time)

  await page.getByRole('button', { name: /Guardar|Crear/i }).click()

  return appointment
}

export async function waitForToast(page: Page) {
  await page.waitForTimeout(500)
}

export async function dismissToast(page: Page) {
  await page.waitForTimeout(1000)
}
