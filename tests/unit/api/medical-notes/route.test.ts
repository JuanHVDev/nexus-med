import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/medical-notes/route'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Map())
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn()
    }
  }
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    medicalNote: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn()
    },
    patient: {
      findFirst: vi.fn()
    },
    appointment: {
      update: vi.fn()
    }
  }
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const mockSession = {
  user: { id: 'user-1', role: 'DOCTOR', clinicId: BigInt(1) }
}

const mockMedicalNote = {
  id: BigInt(1),
  clinicId: BigInt(1),
  patientId: BigInt(1),
  doctorId: 'user-1',
  appointmentId: null,
  specialty: 'General',
  type: 'CONSULTATION',
  chiefComplaint: 'Headache',
  currentIllness: '3 days',
  vitalSigns: { temperature: 36.5 },
  physicalExam: 'Normal',
  diagnosis: 'Tension headache',
  prognosis: 'Good',
  treatment: 'Rest and hydration',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  patient: {
    id: BigInt(1),
    firstName: 'John',
    lastName: 'Doe',
    middleName: null
  },
  doctor: {
    id: 'user-1',
    name: 'Dr. Smith',
    specialty: 'General'
  }
}

describe('Medical Notes API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/medical-notes', () => {
    it('should return medical notes for authenticated user', async () => {
      vi.mocked(prisma.medicalNote.findMany).mockResolvedValue([mockMedicalNote] as any)
      vi.mocked(prisma.medicalNote.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/medical-notes')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.pagination.total).toBe(1)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/medical-notes')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should filter by patientId', async () => {
      vi.mocked(prisma.medicalNote.findMany).mockResolvedValue([mockMedicalNote] as any)
      vi.mocked(prisma.medicalNote.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/medical-notes?patientId=1')
      await GET(request)

      expect(prisma.medicalNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ patientId: BigInt(1) })
        })
      )
    })

    it('should filter by doctorId', async () => {
      vi.mocked(prisma.medicalNote.findMany).mockResolvedValue([mockMedicalNote] as any)
      vi.mocked(prisma.medicalNote.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/medical-notes?doctorId=user-1')
      await GET(request)

      expect(prisma.medicalNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ doctorId: 'user-1' })
        })
      )
    })

    it('should filter by date range', async () => {
      vi.mocked(prisma.medicalNote.findMany).mockResolvedValue([mockMedicalNote] as any)
      vi.mocked(prisma.medicalNote.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/medical-notes?startDate=2024-01-01&endDate=2024-01-31')
      await GET(request)

      expect(prisma.medicalNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31')
            }
          })
        })
      )
    })

    it('should filter by search term', async () => {
      vi.mocked(prisma.medicalNote.findMany).mockResolvedValue([mockMedicalNote] as any)
      vi.mocked(prisma.medicalNote.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/medical-notes?search=headache')
      await GET(request)

      expect(prisma.medicalNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { diagnosis: { contains: 'headache', mode: 'insensitive' } }
            ])
          })
        })
      )
    })
  })

  describe('POST /api/medical-notes', () => {
    it('should create medical note successfully', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue({ id: BigInt(1) } as any)
      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.medicalNote.create).mockResolvedValue(mockMedicalNote as any)

      const request = new NextRequest('http://localhost/api/medical-notes', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          specialty: 'GENERAL',
          type: 'CONSULTATION',
          chiefComplaint: 'Headache',
          diagnosis: 'Tension headache'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/medical-notes', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'RECEPTIONIST', clinicId: BigInt(1) }
      } as any)

      const request = new NextRequest('http://localhost/api/medical-notes', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          specialty: 'GENERAL',
          type: 'CONSULTATION',
          chiefComplaint: 'Test'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/medical-notes', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '999',
          specialty: 'GENERAL',
          type: 'CONSULTATION',
          chiefComplaint: 'Headache',
          diagnosis: 'Test diagnosis'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should update existing note when appointmentId matches', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue({ id: BigInt(1) } as any)
      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue(mockMedicalNote as any)
      vi.mocked(prisma.medicalNote.update).mockResolvedValue(mockMedicalNote as any)
      vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/medical-notes', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          appointmentId: '1',
          specialty: 'GENERAL',
          type: 'CONSULTATION',
          chiefComplaint: 'Headache',
          diagnosis: 'Tension headache'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should update appointment status to IN_PROGRESS for new note', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue({ id: BigInt(1) } as any)
      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.medicalNote.create).mockResolvedValue({
        ...mockMedicalNote,
        appointmentId: BigInt(1)
      } as any)
      vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/medical-notes', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          appointmentId: '1',
          specialty: 'GENERAL',
          type: 'CONSULTATION',
          chiefComplaint: 'Headache',
          diagnosis: 'Test diagnosis'
        })
      })

      await POST(request)

      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'IN_PROGRESS' }
        })
      )
    })
  })
})
