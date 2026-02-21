import { describe, it, expect, beforeAll } from 'vitest'
import { testPrisma } from '../setup/db-setup'
import { getTestClinicId, getTestDoctor, getTestPatient } from '../setup/auth-helpers'
import { prescriptionSchema } from '@/lib/validations/prescription'

describe('Prescriptions Integration', () => {
  let clinicId: bigint

  beforeAll(() => {
    clinicId = getTestClinicId()
  })

  describe('Prescription CRUD Operations', () => {
    it('should list prescriptions for a clinic', async () => {
      const prescriptions = await testPrisma.prescription.findMany({
        where: { doctor: { userClinics: { some: { clinicId } } } },
        orderBy: { issueDate: 'desc' },
        take: 10,
      })

      expect(prescriptions).toBeDefined()
    })

    it('should create a prescription', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()

      const medicalNote = await testPrisma.medicalNote.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          chiefComplaint: 'Dolor',
          diagnosis: 'Tratamiento',
        },
      })

      const prescription = await testPrisma.prescription.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          medicalNoteId: medicalNote.id,
          medications: [
            { name: 'Paracetamol', dosage: '500mg', route: 'Oral', frequency: 'Cada 8h' },
          ],
          instructions: 'Tomar con alimentos',
        },
      })

      expect(prescription).toBeDefined()
      expect(prescription.medications).toBeDefined()

      await testPrisma.prescription.delete({ where: { id: prescription.id } })
      await testPrisma.medicalNote.delete({ where: { id: medicalNote.id } })
    })

    it('should filter prescriptions by patient', async () => {
      const patient = getTestPatient()
      
      const prescriptions = await testPrisma.prescription.findMany({
        where: { patientId: patient.id },
      })

      expect(prescriptions).toBeDefined()
    })

    it('should filter prescriptions by doctor', async () => {
      const doctor = getTestDoctor()
      
      const prescriptions = await testPrisma.prescription.findMany({
        where: { doctorId: doctor.id },
      })

      expect(prescriptions).toBeDefined()
    })

    it('should update prescription', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()

      const medicalNote = await testPrisma.medicalNote.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          chiefComplaint: 'Test',
          diagnosis: 'Test',
        },
      })

      const prescription = await testPrisma.prescription.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          medicalNoteId: medicalNote.id,
          medications: [{ name: 'Test', dosage: '100mg', route: 'Oral' }],
        },
      })

      const updated = await testPrisma.prescription.update({
        where: { id: prescription.id },
        data: { instructions: 'Nuevas instrucciones' },
      })

      expect(updated.instructions).toBe('Nuevas instrucciones')

      await testPrisma.prescription.delete({ where: { id: prescription.id } })
      await testPrisma.medicalNote.delete({ where: { id: medicalNote.id } })
    })
  })

  describe('Prescription Validation', () => {
    it('should validate prescription schema', () => {
      const validData = {
        patientId: '123',
        medicalNoteId: '456',
        medications: [
          { name: 'Paracetamol', dosage: '500mg', route: 'Oral' },
        ],
      }

      const result = prescriptionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require at least one medication', () => {
      const invalidData = {
        patientId: '123',
        medicalNoteId: '456',
        medications: [],
      }

      const result = prescriptionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require medication name', () => {
      const invalidData = {
        patientId: '123',
        medicalNoteId: '456',
        medications: [{ dosage: '500mg', route: 'Oral' }],
      }

      const result = prescriptionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should transform IDs to BigInt', () => {
      const validData = {
        patientId: '123',
        medicalNoteId: '456',
        medications: [{ name: 'Test', dosage: '100mg', route: 'Oral' }],
      }

      const result = prescriptionSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.patientId).toBe(BigInt(123))
        expect(result.data.medicalNoteId).toBe(BigInt(456))
      }
    })
  })

  describe('Prescription with Valid Until', () => {
    it('should handle prescription with validUntil date', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()

      const medicalNote = await testPrisma.medicalNote.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          chiefComplaint: 'Test',
          diagnosis: 'Test',
        },
      })

      const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      
      const prescription = await testPrisma.prescription.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          medicalNoteId: medicalNote.id,
          medications: [{ name: 'Test', dosage: '100mg', route: 'Oral' }],
          validUntil,
        },
      })

      expect(prescription.validUntil).toBeDefined()

      await testPrisma.prescription.delete({ where: { id: prescription.id } })
      await testPrisma.medicalNote.delete({ where: { id: medicalNote.id } })
    })
  })
})
