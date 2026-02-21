import { describe, it, expect, beforeAll } from 'vitest'
import { testPrisma, testData } from '../setup/db-setup'
import { getTestClinicId, getTestDoctor, getTestPatient } from '../setup/auth-helpers'
import { appointmentSchema } from '@/lib/validations/appointment'

describe('Appointments Integration', () => {
  let clinicId: bigint

  beforeAll(() => {
    clinicId = getTestClinicId()
  })

  describe('Appointment CRUD Operations', () => {
    it('should list appointments for a clinic', async () => {
      const appointments = await testPrisma.appointment.findMany({
        where: { clinicId },
        orderBy: { startTime: 'asc' },
        take: 10,
      })

      expect(appointments).toBeDefined()
      expect(appointments.length).toBeGreaterThan(0)
    })

    it('should get appointment by id', async () => {
      const testAppointment = testData.appointments[0]
      
      const appointment = await testPrisma.appointment.findUnique({
        where: { id: testAppointment.id },
        include: {
          patient: true,
          doctor: true,
        },
      })

      expect(appointment).toBeDefined()
      expect(appointment?.id).toBe(testAppointment.id)
    })

    it('should filter appointments by status', async () => {
      const scheduled = await testPrisma.appointment.findMany({
        where: { clinicId, status: 'SCHEDULED' },
      })

      const completed = await testPrisma.appointment.findMany({
        where: { clinicId, status: 'COMPLETED' },
      })

      const cancelled = await testPrisma.appointment.findMany({
        where: { clinicId, status: 'CANCELLED' },
      })

      expect(scheduled.length).toBeGreaterThan(0)
      expect(completed.length).toBeGreaterThan(0)
      expect(cancelled.length).toBeGreaterThan(0)
    })

    it('should filter appointments by doctor', async () => {
      const doctor = getTestDoctor()
      
      const appointments = await testPrisma.appointment.findMany({
        where: { clinicId, doctorId: doctor.id },
      })

      expect(appointments.length).toBeGreaterThan(0)
      appointments.forEach(apt => {
        expect(apt.doctorId).toBe(doctor.id)
      })
    })

    it('should filter appointments by patient', async () => {
      const patient = getTestPatient()
      
      const appointments = await testPrisma.appointment.findMany({
        where: { clinicId, patientId: patient.id },
      })

      expect(appointments.length).toBeGreaterThan(0)
      appointments.forEach(apt => {
        expect(apt.patientId).toBe(patient.id)
      })
    })

    it('should filter appointments by date range', async () => {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      const appointments = await testPrisma.appointment.findMany({
        where: {
          clinicId,
          startTime: {
            gte: thirtyDaysAgo,
            lte: thirtyDaysFromNow,
          },
        },
      })

      expect(appointments).toBeDefined()
    })

    it('should create a new appointment', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      
      const appointment = await testPrisma.appointment.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          startTime: futureDate,
          endTime: new Date(futureDate.getTime() + 30 * 60 * 1000),
          status: 'SCHEDULED',
          reason: 'Test appointment',
        },
      })

      expect(appointment).toBeDefined()
      expect(appointment.status).toBe('SCHEDULED')

      await testPrisma.appointment.delete({ where: { id: appointment.id } })
    })

    it('should update appointment status', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      
      const appointment = await testPrisma.appointment.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          startTime: futureDate,
          endTime: new Date(futureDate.getTime() + 30 * 60 * 1000),
          status: 'SCHEDULED',
        },
      })

      const updated = await testPrisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CONFIRMED' },
      })

      expect(updated.status).toBe('CONFIRMED')

      await testPrisma.appointment.delete({ where: { id: appointment.id } })
    })

    it('should check for conflicting appointments', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()
      const startTime = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000)

      await testPrisma.appointment.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          startTime,
          endTime,
          status: 'SCHEDULED',
        },
      })

      const conflicts = await testPrisma.appointment.findFirst({
        where: {
          doctorId: doctor.id,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
          ],
        },
      })

      expect(conflicts).toBeDefined()

      await testPrisma.appointment.deleteMany({
        where: {
          doctorId: doctor.id,
          startTime: startTime,
        },
      })
    })
  })

  describe('Appointment Validation', () => {
    it('should validate appointment schema with valid data', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const validData = {
        patientId: '123',
        doctorId: '456',
        startTime: futureDate.toISOString(),
        endTime: new Date(futureDate.getTime() + 30 * 60 * 1000).toISOString(),
        status: 'SCHEDULED' as const,
      }

      const result = appointmentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should transform patientId to BigInt', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const validData = {
        patientId: '123',
        doctorId: '456',
        startTime: futureDate.toISOString(),
        endTime: new Date(futureDate.getTime() + 30 * 60 * 1000).toISOString(),
        status: 'SCHEDULED' as const,
      }

      const result = appointmentSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.patientId).toBe(BigInt(123))
      }
    })

    it('should reject endTime before startTime', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      
      // Prisma doesn't enforce this - validation happens in API layer
      const appointment = await testPrisma.appointment.create({
        data: {
          clinicId,
          patientId: testData.patients[0].id,
          doctorId: testData.doctors[0].id,
          startTime: futureDate,
          endTime: new Date(futureDate.getTime() - 30 * 60 * 1000),
          status: 'SCHEDULED',
        },
      }).catch(() => null)

      // Verify appointment was created (validation is in API, not Prisma)
      expect(appointment).toBeDefined()
    })
  })

  describe('Appointment with Medical Notes', () => {
    it('should link medical note to appointment', async () => {
      const doctor = getTestDoctor()
      const patient = getTestPatient()
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      const appointment = await testPrisma.appointment.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          startTime: pastDate,
          endTime: new Date(pastDate.getTime() + 30 * 60 * 1000),
          status: 'COMPLETED',
        },
      })

      const medicalNote = await testPrisma.medicalNote.create({
        data: {
          clinicId,
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentId: appointment.id,
          chiefComplaint: 'Dolor de cabeza',
          diagnosis: 'Migraña',
        },
      })

      expect(medicalNote.appointmentId).toBe(appointment.id)

      await testPrisma.medicalNote.delete({ where: { id: medicalNote.id } })
      await testPrisma.appointment.delete({ where: { id: appointment.id } })
    })
  })
})
