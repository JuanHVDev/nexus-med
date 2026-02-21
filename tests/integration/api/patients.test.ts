import { describe, it, expect, beforeAll } from 'vitest'
import { testPrisma, testData } from '../setup/db-setup'
import { getTestClinicId } from '../setup/auth-helpers'
import { patientSchema } from '@/lib/validations/patient'

describe('Patients Integration', () => {
  let clinicId: bigint

  beforeAll(() => {
    clinicId = getTestClinicId()
  })

  describe('Patient CRUD Operations', () => {
    it('should list patients for a clinic', async () => {
      const patients = await testPrisma.patient.findMany({
        where: { clinicId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      expect(patients).toBeDefined()
      expect(patients.length).toBeGreaterThan(0)
      expect(patients.length).toBeLessThanOrEqual(10)
    })

    it('should get patient by id', async () => {
      const testPatient = testData.patients[0]
      
      const patient = await testPrisma.patient.findUnique({
        where: { id: testPatient.id },
        include: { medicalHistory: true },
      })

      expect(patient).toBeDefined()
      expect(patient?.firstName).toBe(testPatient.firstName)
      expect(patient?.lastName).toBe(testPatient.lastName)
    })

    it('should create a new patient', async () => {
      const newPatient = await testPrisma.patient.create({
        data: {
          clinicId,
          firstName: 'Nuevo',
          lastName: 'Paciente',
          curp: `NEW${Date.now()}PAT`,
          birthDate: new Date('1995-05-15'),
          gender: 'MALE',
          phone: '5559998888',
          isActive: true,
        },
      })

      expect(newPatient).toBeDefined()
      expect(newPatient.firstName).toBe('Nuevo')
      expect(newPatient.lastName).toBe('Paciente')
      expect(newPatient.clinicId).toBe(clinicId)

      await testPrisma.patient.delete({ where: { id: newPatient.id } })
    })

    it('should update a patient', async () => {
      const testPatient = testData.patients[0]
      
      const updated = await testPrisma.patient.update({
        where: { id: testPatient.id },
        data: { phone: '5551111111' },
      })

      expect(updated.phone).toBe('5551111111')
    })

    it('should soft delete a patient', async () => {
      const newPatient = await testPrisma.patient.create({
        data: {
          clinicId,
          firstName: 'Delete',
          lastName: 'Test',
          curp: `DEL${Date.now()}TST`,
          birthDate: new Date('1990-01-01'),
          gender: 'MALE',
          isActive: true,
        },
      })

      const deleted = await testPrisma.patient.update({
        where: { id: newPatient.id },
        data: { deletedAt: new Date() },
      })

      expect(deleted.deletedAt).toBeDefined()

      const found = await testPrisma.patient.findFirst({
        where: { id: newPatient.id, deletedAt: null },
      })

      expect(found).toBeNull()

      await testPrisma.patient.delete({ where: { id: newPatient.id } })
    })

    it('should search patients by name', async () => {
      const patients = await testPrisma.patient.findMany({
        where: {
          clinicId,
          deletedAt: null,
          OR: [
            { firstName: { contains: 'Paciente', mode: 'insensitive' } },
            { lastName: { contains: 'Test', mode: 'insensitive' } },
          ],
        },
      })

      expect(patients).toBeDefined()
      expect(patients.length).toBeGreaterThan(0)
    })

    it('should filter patients by gender', async () => {
      const malePatients = await testPrisma.patient.findMany({
        where: { clinicId, gender: 'MALE' },
      })

      const femalePatients = await testPrisma.patient.findMany({
        where: { clinicId, gender: 'FEMALE' },
      })

      expect(malePatients.length).toBeGreaterThan(0)
      expect(femalePatients.length).toBeGreaterThan(0)
    })
  })

  describe('Patient Validation', () => {
    it('should validate patient schema with valid data', () => {
      const validData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        birthDate: '1990-01-15',
        gender: 'MALE' as const,
        email: 'juan@test.com',
      }

      const result = patientSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid CURP format', () => {
      const invalidData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        curp: 'INVALID',
        birthDate: '1990-01-15',
        gender: 'MALE' as const,
      }

      const result = patientSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept valid CURP format', () => {
      const validData = {
        firstName: 'Juan',
        lastName: 'Pérez',
        curp: 'AAAA010101HNEXXXA1',
        birthDate: '1990-01-15',
        gender: 'MALE' as const,
      }

      const result = patientSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Emergency Contacts', () => {
    it('should create emergency contact for patient', async () => {
      const testPatient = testData.patients[0]

      const contact = await testPrisma.emergencyContact.create({
        data: {
          patientId: testPatient.id,
          name: 'Contacto Emergencia',
          relation: 'Madre',
          phone: '5557776666',
          isPrimary: true,
        },
      })

      expect(contact).toBeDefined()
      expect(contact.name).toBe('Contacto Emergencia')
      expect(contact.relation).toBe('Madre')

      await testPrisma.emergencyContact.delete({ where: { id: contact.id } })
    })

    it('should get emergency contacts for patient', async () => {
      const testPatient = testData.patients[0]

      const contacts = await testPrisma.emergencyContact.findMany({
        where: { patientId: testPatient.id },
      })

      expect(contacts).toBeDefined()
    })
  })

  describe('Medical History', () => {
    it('should create medical history for patient', async () => {
      const newPatient = await testPrisma.patient.create({
        data: {
          clinicId,
          firstName: 'History',
          lastName: 'Test',
          curp: `HIS${Date.now()}TST`,
          birthDate: new Date('1990-01-01'),
          gender: 'MALE',
          isActive: true,
        },
      })

      const history = await testPrisma.medicalHistory.create({
        data: {
          patientId: newPatient.id,
          allergies: ['Penicillin'],
          chronicDiseases: ['Diabetes'],
          smoking: false,
          alcohol: false,
        },
      })

      expect(history).toBeDefined()
      expect(history.allergies).toContain('Penicillin')
      expect(history.chronicDiseases).toContain('Diabetes')

      await testPrisma.medicalHistory.delete({ where: { id: history.id } })
      await testPrisma.patient.delete({ where: { id: newPatient.id } })
    })
  })
})
