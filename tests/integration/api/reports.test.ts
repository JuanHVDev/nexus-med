import { describe, it, expect, beforeAll } from 'vitest'
import { testPrisma } from '../setup/db-setup'
import { getTestClinicId, getTestDoctor } from '../setup/auth-helpers'

describe('Reports Integration', () => {
  let clinicId: bigint

  beforeAll(() => {
    clinicId = getTestClinicId()
  })

  describe('Patient Reports', () => {
    it('should get patients report data', async () => {
      const patients = await testPrisma.patient.findMany({
        where: { clinicId, deletedAt: null },
        include: {
          appointments: true,
          medicalNotes: true,
        },
      })

      expect(patients).toBeDefined()
      
      const reportData = patients.map(p => ({
        id: p.id.toString(),
        name: `${p.firstName} ${p.lastName}`,
        curp: p.curp,
        phone: p.phone,
        email: p.email,
        appointmentCount: p.appointments.length,
        noteCount: p.medicalNotes.length,
        createdAt: p.createdAt,
      }))

      expect(reportData.length).toBeGreaterThan(0)
    })

    it('should filter patients by date range', async () => {
      const now = new Date()
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

      const patients = await testPrisma.patient.findMany({
        where: {
          clinicId,
          deletedAt: null,
          createdAt: { gte: yearAgo },
        },
      })

      expect(patients).toBeDefined()
    })

    it('should count patients by gender', async () => {
      const male = await testPrisma.patient.count({
        where: { clinicId, gender: 'MALE', deletedAt: null },
      })

      const female = await testPrisma.patient.count({
        where: { clinicId, gender: 'FEMALE', deletedAt: null },
      })

      expect(male).toBeGreaterThan(0)
      expect(female).toBeGreaterThan(0)
    })
  })

  describe('Appointment Reports', () => {
    it('should get appointments report data', async () => {
      const appointments = await testPrisma.appointment.findMany({
        where: { clinicId },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { name: true, specialty: true } },
        },
      })

      expect(appointments).toBeDefined()

      const reportData = appointments.map(a => ({
        id: a.id.toString(),
        patient: `${a.patient.firstName} ${a.patient.lastName}`,
        doctor: a.doctor.name,
        specialty: a.doctor.specialty,
        startTime: a.startTime,
        status: a.status,
      }))

      expect(reportData.length).toBeGreaterThan(0)
    })

    it('should count appointments by status', async () => {
      const scheduled = await testPrisma.appointment.count({
        where: { clinicId, status: 'SCHEDULED' },
      })

      const completed = await testPrisma.appointment.count({
        where: { clinicId, status: 'COMPLETED' },
      })

      const cancelled = await testPrisma.appointment.count({
        where: { clinicId, status: 'CANCELLED' },
      })

      expect(scheduled).toBeGreaterThan(0)
      expect(completed).toBeGreaterThan(0)
      expect(cancelled).toBeGreaterThan(0)
    })

    it('should filter appointments by date range', async () => {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const appointments = await testPrisma.appointment.findMany({
        where: {
          clinicId,
          startTime: { gte: thirtyDaysAgo },
        },
      })

      expect(appointments).toBeDefined()
    })
  })

  describe('Financial Reports', () => {
    it('should get invoices report data', async () => {
      const invoices = await testPrisma.invoice.findMany({
        where: { clinicId },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          payments: true,
        },
      })

      expect(invoices).toBeDefined()

      const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total), 0)
      const totalPaid = invoices.reduce((sum, inv) => {
        return sum + inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)
      }, 0)

      expect(totalAmount).toBeGreaterThanOrEqual(0)
      expect(totalPaid).toBeGreaterThanOrEqual(0)
    })

    it('should calculate revenue by period', async () => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const invoices = await testPrisma.invoice.findMany({
        where: {
          clinicId,
          issueDate: { gte: startOfMonth },
        },
        include: { payments: true },
      })

      const revenue = invoices.reduce((sum, inv) => {
        const paid = (inv.payments || []).reduce((pSum, p) => pSum + Number(p.amount), 0)
        return sum + paid
      }, 0)

      expect(revenue).toBeGreaterThanOrEqual(0)
    })

    it('should get pending payments', async () => {
      const pending = await testPrisma.invoice.findMany({
        where: { clinicId, status: 'PENDING' },
      })

      const pendingAmount = pending.reduce((sum, inv) => sum + Number(inv.total), 0)

      expect(pendingAmount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Medical Reports', () => {
    it('should get medical notes report data', async () => {
      const notes = await testPrisma.medicalNote.findMany({
        where: { clinicId },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { name: true, specialty: true } },
        },
      })

      expect(notes).toBeDefined()

      const reportData = notes.map(n => ({
        id: n.id.toString(),
        patient: `${n.patient.firstName} ${n.patient.lastName}`,
        doctor: n.doctor.name,
        specialty: n.doctor.specialty,
        diagnosis: n.diagnosis,
        createdAt: n.createdAt,
      }))

      expect(reportData.length).toBeGreaterThan(0)
    })

    it('should count diagnoses', async () => {
      const diagnoses = await testPrisma.medicalNote.groupBy({
        by: ['diagnosis'],
        where: { clinicId },
        _count: true,
      })

      expect(diagnoses).toBeDefined()
    })

    it('should filter notes by specialty', async () => {
      const generalNotes = await testPrisma.medicalNote.findMany({
        where: { clinicId, specialty: 'GENERAL' },
      })

      expect(generalNotes).toBeDefined()
    })
  })

  describe('Doctor Reports', () => {
    it('should get doctor statistics', async () => {
      const doctors = await testPrisma.user.findMany({
        where: {
          userClinics: { some: { clinicId, role: 'DOCTOR' } },
        },
      })

      for (const doctor of doctors) {
        const appointmentCount = await testPrisma.appointment.count({
          where: { doctorId: doctor.id },
        })

        const noteCount = await testPrisma.medicalNote.count({
          where: { doctorId: doctor.id },
        })

        expect(appointmentCount).toBeGreaterThanOrEqual(0)
        expect(noteCount).toBeGreaterThanOrEqual(0)
      }
    })

    it('should get completed appointments per doctor', async () => {
      const doctor = getTestDoctor()

      const completed = await testPrisma.appointment.count({
        where: { doctorId: doctor.id, status: 'COMPLETED' },
      })

      expect(completed).toBeGreaterThanOrEqual(0)
    })
  })
})
