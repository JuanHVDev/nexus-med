import { describe, it, expect, beforeAll } from 'vitest'
import { testPrisma } from '../setup/db-setup'
import { getTestClinicId, getTestDoctor, getTestPatient } from '../setup/auth-helpers'
import { imagingOrderCreateSchema } from '@/lib/validations/imaging-order'

describe('Imaging Orders Integration', () => {
  let clinicId: bigint

  beforeAll(() => {
    clinicId = getTestClinicId()
  })

  describe('Imaging Order CRUD Operations', () => {
    it('should list imaging orders for a clinic', async () => {
      const orders = await testPrisma.imagingOrder.findMany({
        where: { clinicId },
        orderBy: { orderDate: 'desc' },
        take: 10,
      })

      expect(orders).toBeDefined()
    })

    it('should create an imaging order', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()

      const imagingOrder = await testPrisma.imagingOrder.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          studyType: 'RX',
          bodyPart: 'Tórax',
          reason: 'Dolor torácico',
          status: 'PENDING',
        },
      })

      expect(imagingOrder).toBeDefined()
      expect(imagingOrder.studyType).toBe('RX')
      expect(imagingOrder.bodyPart).toBe('Tórax')

      await testPrisma.imagingOrder.delete({ where: { id: imagingOrder.id } })
    })

    it('should update imaging order status', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()

      const imagingOrder = await testPrisma.imagingOrder.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          studyType: 'USG',
          bodyPart: 'Abdomen',
          status: 'PENDING',
        },
      })

      const updated = await testPrisma.imagingOrder.update({
        where: { id: imagingOrder.id },
        data: { status: 'IN_PROGRESS' },
      })

      expect(updated.status).toBe('IN_PROGRESS')

      await testPrisma.imagingOrder.delete({ where: { id: imagingOrder.id } })
    })

    it('should complete imaging order with findings', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()

      const imagingOrder = await testPrisma.imagingOrder.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          studyType: 'TAC',
          bodyPart: 'Cerebro',
          status: 'IN_PROGRESS',
        },
      })

      const completed = await testPrisma.imagingOrder.update({
        where: { id: imagingOrder.id },
        data: {
          status: 'COMPLETED',
          findings: 'Hallazgos normales',
          impression: 'Sin alteraciones',
          completedAt: new Date(),
        },
      })

      expect(completed.status).toBe('COMPLETED')
      expect(completed.findings).toBe('Hallazgos normales')

      await testPrisma.imagingOrder.delete({ where: { id: imagingOrder.id } })
    })

    it('should link imaging order to medical note', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()

      const medicalNote = await testPrisma.medicalNote.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          chiefComplaint: 'Dolor abdominal',
          diagnosis: 'Estudio requerido',
        },
      })

      const imagingOrder = await testPrisma.imagingOrder.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          medicalNoteId: medicalNote.id,
          studyType: 'USG',
          bodyPart: 'Abdomen',
        },
      })

      expect(imagingOrder.medicalNoteId).toBe(medicalNote.id)

      await testPrisma.imagingOrder.delete({ where: { id: imagingOrder.id } })
      await testPrisma.medicalNote.delete({ where: { id: medicalNote.id } })
    })

    it('should filter imaging orders by study type', async () => {
      const rxOrders = await testPrisma.imagingOrder.findMany({
        where: { clinicId, studyType: 'RX' },
      })

      expect(rxOrders).toBeDefined()
    })

    it('should filter imaging orders by status', async () => {
      const pending = await testPrisma.imagingOrder.findMany({
        where: { clinicId, status: 'PENDING' },
      })

      expect(pending).toBeDefined()
    })
  })

  describe('Imaging Order Validation', () => {
    it('should validate imaging order schema', () => {
      const validData = {
        patientId: '123',
        doctorId: '456',
        studyType: 'RX',
        bodyPart: 'Tórax',
      }

      const result = imagingOrderCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require studyType', () => {
      const invalidData = {
        patientId: '123',
        doctorId: '456',
        bodyPart: 'Tórax',
      }

      const result = imagingOrderCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require bodyPart', () => {
      const invalidData = {
        patientId: '123',
        doctorId: '456',
        studyType: 'RX',
      }

      const result = imagingOrderCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept all valid study types', () => {
      const studyTypes = ['RX', 'USG', 'TAC', 'RM', 'ECG', 'EO', 'MAM', 'DENS', 'OTRO']

      studyTypes.forEach(type => {
        const validData = {
          patientId: '123',
          doctorId: '456',
          studyType: type,
          bodyPart: 'Test',
        }
        const result = imagingOrderCreateSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })
  })
})
