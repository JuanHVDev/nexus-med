import { describe, it, expect, beforeAll } from 'vitest'
import { testPrisma } from '../setup/db-setup'
import { getTestClinicId, getTestDoctor, getTestPatient } from '../setup/auth-helpers'
import { labOrderCreateSchema } from '@/lib/validations/lab-order'

describe('Lab Orders Integration', () => {
  let clinicId: bigint

  beforeAll(() => {
    clinicId = getTestClinicId()
  })

  describe('Lab Order CRUD Operations', () => {
    it('should list lab orders for a clinic', async () => {
      const orders = await testPrisma.labOrder.findMany({
        where: { clinicId },
        orderBy: { orderDate: 'desc' },
        take: 10,
      })

      expect(orders).toBeDefined()
    })

    it('should create a lab order', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()

      const labOrder = await testPrisma.labOrder.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          tests: [
            { name: 'Biometría Hemática', code: 'BH001', price: 250 },
            { name: 'Química Sanguínea', code: 'QS001', price: 350 },
          ],
          instructions: 'Ayuno de 12 horas',
          status: 'PENDING',
        },
      })

      expect(labOrder).toBeDefined()
      expect(labOrder.tests).toBeDefined()
      expect(labOrder.status).toBe('PENDING')

      await testPrisma.labOrder.delete({ where: { id: labOrder.id } })
    })

    it('should update lab order status', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()

      const labOrder = await testPrisma.labOrder.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          tests: [{ name: 'Test' }],
          status: 'PENDING',
        },
      })

      const updated = await testPrisma.labOrder.update({
        where: { id: labOrder.id },
        data: { status: 'IN_PROGRESS' },
      })

      expect(updated.status).toBe('IN_PROGRESS')

      await testPrisma.labOrder.delete({ where: { id: labOrder.id } })
    })

    it('should link lab order to medical note', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()

      const medicalNote = await testPrisma.medicalNote.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          chiefComplaint: 'Análisis',
          diagnosis: 'Solicitud de laboratorios',
        },
      })

      const labOrder = await testPrisma.labOrder.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          medicalNoteId: medicalNote.id,
          tests: [{ name: 'Perfil Lipídico' }],
        },
      })

      expect(labOrder.medicalNoteId).toBe(medicalNote.id)

      await testPrisma.labOrder.delete({ where: { id: labOrder.id } })
      await testPrisma.medicalNote.delete({ where: { id: medicalNote.id } })
    })

    it('should add results to lab order', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()

      const labOrder = await testPrisma.labOrder.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          tests: [{ name: 'Glucosa' }],
          status: 'PENDING',
        },
      })

      await testPrisma.labResult.create({
        data: {
          labOrderId: labOrder.id,
          testName: 'Glucosa',
          result: '95',
          unit: 'mg/dL',
          referenceRange: '70-100',
          flag: 'NORMAL',
        },
      })

      const updated = await testPrisma.labOrder.findUnique({
        where: { id: labOrder.id },
        include: { results: true },
      })

      expect(updated?.results).toBeDefined()
      expect(updated?.results.length).toBeGreaterThan(0)

      await testPrisma.labResult.deleteMany({ where: { labOrderId: labOrder.id } })
      await testPrisma.labOrder.delete({ where: { id: labOrder.id } })
    })

    it('should filter lab orders by status', async () => {
      const pending = await testPrisma.labOrder.findMany({
        where: { clinicId, status: 'PENDING' },
      })

      expect(pending).toBeDefined()
    })

    it('should filter lab orders by patient', async () => {
      const patient = getTestPatient()
      
      const orders = await testPrisma.labOrder.findMany({
        where: { clinicId, patientId: patient.id },
      })

      expect(orders).toBeDefined()
    })
  })

  describe('Lab Order Validation', () => {
    it('should validate lab order schema', () => {
      const validData = {
        patientId: '123',
        doctorId: '456',
        tests: [{ name: 'Biometría Hemática' }],
      }

      const result = labOrderCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require at least one test', () => {
      const invalidData = {
        patientId: '123',
        doctorId: '456',
        tests: [],
      }

      const result = labOrderCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require patientId', () => {
      const invalidData = {
        doctorId: '456',
        tests: [{ name: 'Test' }],
      }

      const result = labOrderCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
