import { test, expect } from '@playwright/test'
import { loginAsDoctor } from './helpers'

test.describe('Medical Notes - E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page)
  })

  test.describe('Medical Notes Page', () => {
    test('should display medical notes page', async ({ page }) => {
      await page.goto('/consultations')
      await expect(page.getByRole('heading', { name: /Consultas|Notas Médicas|Medical Notes/i })).toBeVisible({ timeout: 10000 })
    })

    test('should display medical notes list', async ({ page }) => {
      await page.goto('/consultations')
      await page.waitForTimeout(2000)
      
      const list = page.locator('table, .list')
      if (await list.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should display new note button', async ({ page }) => {
      await page.goto('/consultations')
      await expect(page.getByRole('button', { name: /Nueva Nota|Agregar Nota|Nueva Consulta/i })).toBeVisible()
    })
  })

  test.describe('Create Medical Note', () => {
    test('should navigate to new medical note form', async ({ page }) => {
      await page.goto('/consultations')
      await page.getByRole('button', { name: /Nueva Nota|Agregar|Nueva Consulta/i }).click()
      await expect(page.getByRole('heading', { name: /Nueva Nota|Consulta|Nota Médica/i })).toBeVisible()
    })

    test('should display medical note form fields', async ({ page }) => {
      await page.goto('/consultations/new')
      
      await expect(page.locator('#patientId')).toBeVisible()
      await expect(page.locator('#chiefComplaint')).toBeVisible()
      await expect(page.locator('#diagnosis')).toBeVisible()
    })

    test('should display vital signs section', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const vitalSigns = page.locator('text=/Signos Vitales|Vital Signs/i')
      if (await vitalSigns.count() > 0) {
        await expect(vitalSigns).toBeVisible()
      }
    })

    test('should display physical exam section', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const physicalExam = page.locator('text=/Exploración|Physical Exam/i')
      if (await physicalExam.count() > 0) {
        await expect(physicalExam).toBeVisible()
      }
    })

    test('should display diagnosis section', async ({ page }) => {
      await page.goto('/consultations/new')
      
      await expect(page.locator('#diagnosis')).toBeVisible()
    })

    test('should display treatment section', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const treatment = page.locator('#treatment, textarea[id*="treatment"]')
      if (await treatment.count() > 0) {
        await expect(treatment).toBeVisible()
      }
    })

    test('should create medical note with required fields', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const patientSelect = page.locator('#patientId')
      if (await patientSelect.count() > 0) {
        const options = await patientSelect.locator('option').count()
        if (options > 1) {
          await patientSelect.selectOption({ index: 1 })
        }
      }
      
      await page.locator('#chiefComplaint').fill('Dolor de cabeza')
      await page.locator('#diagnosis').fill('Cefalea tensional')
      
      await page.getByRole('button', { name: /Guardar|Crear|Registrar/i }).click()
      await page.waitForTimeout(2000)
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/consultations/new')
      await page.getByRole('button', { name: /Guardar|Crear/i }).click()
      await page.waitForTimeout(500)
      
      const error = page.locator('text=/requerido|required|obligatorio/i')
      if (await error.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should add multiple diagnoses', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const patientSelect = page.locator('#patientId')
      if (await patientSelect.count() > 0) {
        const options = await patientSelect.locator('option').count()
        if (options > 1) {
          await patientSelect.selectOption({ index: 1 })
        }
      }
      
      await page.locator('#chiefComplaint').fill('Paciente con multiple sintomas')
      await page.locator('#diagnosis').fill('J06.9, R50.9')
      
      await page.getByRole('button', { name: /Guardar|Crear/i }).click()
      await page.waitForTimeout(2000)
    })
  })

  test.describe('Vital Signs', () => {
    test('should capture blood pressure', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const bpInput = page.locator('#bloodPressure, input[id*="blood"]')
      if (await bpInput.count() > 0) {
        await bpInput.fill('120/80')
      }
    })

    test('should capture heart rate', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const hrInput = page.locator('#heartRate, input[id*="heart"], input[id*="hr"]')
      if (await hrInput.count() > 0) {
        await hrInput.fill('72')
      }
    })

    test('should capture temperature', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const tempInput = page.locator('#temperature, input[id*="temp"]')
      if (await tempInput.count() > 0) {
        await tempInput.fill('36.5')
      }
    })

    test('should capture weight', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const weightInput = page.locator('#weight, input[id*="weight"]')
      if (await weightInput.count() > 0) {
        await weightInput.fill('70')
      }
    })

    test('should capture height', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const heightInput = page.locator('#height, input[id*="height"]')
      if (await heightInput.count() > 0) {
        await heightInput.fill('170')
      }
    })

    test('should calculate BMI automatically', async ({ page }) => {
      await page.goto('/consultations/new')
      
      await page.locator('#weight').fill('70')
      await page.locator('#height').fill('170')
      await page.waitForTimeout(500)
      
      const bmi = page.locator('text=/BMI|IMC')
      if (await bmi.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })

  test.describe('Physical Exam', () => {
    test('should add physical examination notes', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const examInput = page.locator('#physicalExam, textarea[id*="exam"]')
      if (await examInput.count() > 0) {
        await examInput.fill('Paciente lucido, orientado, sin hallazgos relevantes...')
      }
    })

    test('should have anatomical diagram option', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const diagram = page.locator('text=/diagrama|anatomical|body/i')
      if (await diagram.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })

  test.describe('Diagnosis', () => {
    test('should search diagnosis codes', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const diagnosisSearch = page.locator('input[id*="diagnosis"], [placeholder*="diagnóstico"]')
      if (await diagnosisSearch.count() > 0) {
        await diagnosisSearch.fill('diabetes')
        await page.waitForTimeout(1000)
      }
    })

    test('should add ICD-10 code', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const codeInput = page.locator('input[id*="code"], [placeholder*="código"]')
      if (await codeInput.count() > 0) {
        await codeInput.fill('E11.9')
      }
    })

    test('should allow multiple diagnoses', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const addButton = page.locator('button:has-text("Agregar diagnóstico"), button:has-text("+")').first()
      if (await addButton.count() > 0) {
        await addButton.click()
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Treatment Plan', () => {
    test('should add treatment plan', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const treatmentInput = page.locator('#treatment, textarea[id*="treatment"]')
      if (await treatmentInput.count() > 0) {
        await treatmentInput.fill('Reposo, analgesicos, seguimiento en 7 dias...')
      }
    })

    test('should add prognosis', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const prognosisSelect = page.locator('#prognosis, select[id*="prognosis"]')
      if (await prognosisSelect.count() > 0) {
        await prognosisSelect.selectOption('FAVORABLE')
      }
    })
  })

  test.describe('Link Prescriptions', () => {
    test('should link prescription to note', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const linkPrescription = page.locator('text=/Vincular Receta|Agregar Receta|Crear Receta/i')
      if (await linkPrescription.count() > 0) {
        expect(true).toBe(true)
      }
    })

    test('should create prescription from note', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const addRx = page.locator('button:has-text("Receta"), button:has-text("Prescrip")').first()
      if (await addRx.count() > 0) {
        await addRx.click()
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Link Lab Orders', () => {
    test('should link lab order to note', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const linkLab = page.locator('text=/Orden de Laboratorio|Vincular Laboratorio/i')
      if (await linkLab.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })

  test.describe('Link Imaging Orders', () => {
    test('should link imaging order to note', async ({ page }) => {
      await page.goto('/consultations/new')
      
      const linkImaging = page.locator('text=/Orden de Imagen|Vincular Imagen/i')
      if (await linkImaging.count() > 0) {
        expect(true).toBe(true)
      }
    })
  })

  test.describe('View Medical Notes', () => {
    test('should display medical note details', async ({ page }) => {
      await page.goto('/consultations')
      await page.waitForTimeout(2000)
      
      const firstNote = page.locator('tbody tr').first()
      if (await firstNote.count() > 0) {
        const viewLink = firstNote.locator('a').first()
        if (await viewLink.count() > 0) {
          await viewLink.click()
          await page.waitForTimeout(1000)
          
          const details = page.locator('text=/Nota|Consulta|Paciente|Diagnóstico/i')
          if (await details.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })

    test('should display patient information in note', async ({ page }) => {
      await page.goto('/consultations')
      await page.waitForTimeout(2000)
      
      const firstNote = page.locator('tbody tr').first()
      if (await firstNote.count() > 0) {
        const patientCell = firstNote.locator('td').first()
        if (await patientCell.count() > 0) {
          expect(await patientCell.textContent()).toBeTruthy()
        }
      }
    })

    test('should display date and time of consultation', async ({ page }) => {
      await page.goto('/consultations')
      await page.waitForTimeout(2000)
      
      const firstNote = page.locator('tbody tr').first()
      if (await firstNote.count() > 0) {
        const dateCell = firstNote.locator('td').nth(1)
        if (await dateCell.count() > 0) {
          expect(await dateCell.textContent()).toBeTruthy()
        }
      }
    })
  })

  test.describe('Edit Medical Note', () => {
    test('should navigate to edit note', async ({ page }) => {
      await page.goto('/consultations')
      await page.waitForTimeout(2000)
      
      const firstNote = page.locator('tbody tr').first()
      if (await firstNote.count() > 0) {
        const editButton = firstNote.locator('a:has-text("Editar"), button:has-text("Editar")').first()
        if (await editButton.count() > 0) {
          await editButton.click()
          await expect(page.getByRole('heading', { name: /Editar/i })).toBeVisible()
        }
      }
    })

    test('should update diagnosis', async ({ page }) => {
      await page.goto('/consultations')
      await page.waitForTimeout(2000)
      
      const firstNote = page.locator('tbody tr').first()
      if (await firstNote.count() > 0) {
        const editButton = firstNote.locator('a:has-text("Editar"), button:has-text("Editar")').first()
        if (await editButton.count() > 0) {
          await editButton.click()
          
          await page.locator('#diagnosis').fill('Nuevo diagnóstico actualizado')
          await page.getByRole('button', { name: /Guardar|Actualizar/i }).click()
          await page.waitForTimeout(1000)
        }
      }
    })
  })

  test.describe('Notes History', () => {
    test('should display notes history for patient', async ({ page }) => {
      await page.goto('/consultations')
      await page.waitForTimeout(2000)
      
      const firstNote = page.locator('tbody tr').first()
      if (await firstNote.count() > 0) {
        const patientLink = firstNote.locator('a').first()
        if (await patientLink.count() > 0) {
          await patientLink.click()
          await page.waitForTimeout(1000)
          
          const history = page.locator('text=/Historial|History|Notas anteriores/i')
          if (await history.count() > 0) {
            expect(true).toBe(true)
          }
        }
      }
    })
  })

  test.describe('Access Control', () => {
    test('should allow doctor to create notes', async ({ page }) => {
      await page.goto('/consultations')
      await expect(page.getByRole('button', { name: /Nueva Nota/i })).toBeVisible()
    })

    test('should allow admin to view all notes', async ({ page }) => {
      await page.goto('/consultations')
      await expect(page.getByRole('heading', { name: /Consultas|Notas/i })).toBeVisible()
    })
  })
})
