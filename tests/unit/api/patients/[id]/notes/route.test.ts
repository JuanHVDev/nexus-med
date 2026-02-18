import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/patients/[id]/notes/route'
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
    patient: {
      findFirst: vi.fn()
    },
    medicalNote: {
      findMany: vi.fn()
    }
  }
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const mockSession = {
  user: { id: 'user-1', role: 'DOCTOR', clinicId: BigInt(1) }
}

const mockPatient = {
  id: BigInt(1),
  clinicId: BigInt(1),
  deletedAt: null
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
  doctor: {
    id: 'user-1',
    name: 'Dr. Smith',
    specialty: 'General'
  }
}

describe('Patient Notes API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/patients/[id]/notes', () => {
    it('should return medical notes for patient', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as any)
      vi.mocked(prisma.medicalNote.findMany).mockResolvedValue([mockMedicalNote] as any)

      const response = await GET(new NextRequest('http://localhost/api/patients/1/notes'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/patients/1/notes'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/patients/999/notes'), {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should order notes by createdAt desc', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as any)
      vi.mocked(prisma.medicalNote.findMany).mockResolvedValue([mockMedicalNote] as any)

      await GET(new NextRequest('http://localhost/api/patients/1/notes'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(prisma.medicalNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' }
        })
      )
    })

    it('should include doctor in response', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as any)
      vi.mocked(prisma.medicalNote.findMany).mockResolvedValue([mockMedicalNote] as any)

      const response = await GET(new NextRequest('http://localhost/api/patients/1/notes'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(data[0].doctor).toBeDefined()
      expect(data[0].doctor.name).toBe('Dr. Smith')
    })
  })
})
