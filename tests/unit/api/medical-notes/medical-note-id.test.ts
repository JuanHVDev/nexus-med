import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH } from '@/app/api/medical-notes/[id]/route'
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
      findFirst: vi.fn(),
      update: vi.fn()
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

describe('Medical Notes [id] API Route - Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/medical-notes/[id]', () => {
    it('should return medical note by id', async () => {
      const mockNote = {
        id: BigInt(1),
        clinicId: BigInt(1),
        patientId: BigInt(1),
        doctorId: 'doctor-1',
        chiefComplaint: 'Dolor de cabeza',
        diagnosis: 'Migraña',
        treatment: null,
        notes: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        patient: { id: BigInt(1), firstName: 'Juan', lastName: 'Pérez', middleName: null },
        doctor: { id: 'doctor-1', name: 'Dr. Smith', email: 'smith@test.com', specialty: 'Neurology', licenseNumber: '12345' },
        prescriptions: [],
        appointment: null
      }

      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue(mockNote as any)

      const request = new NextRequest('http://localhost/api/medical-notes/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.diagnosis).toBe('Migraña')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/medical-notes/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(401)
    })

    it('should return 404 when note not found', async () => {
      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/medical-notes/999')
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/medical-notes/[id]', () => {
    it('should update medical note', async () => {
      const mockNote = {
        id: BigInt(1),
        clinicId: BigInt(1),
        patientId: BigInt(1),
        doctorId: 'doctor-1',
        diagnosis: 'Migraña actualizada',
        treatment: null,
        notes: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        appointmentId: null,
        patient: { id: BigInt(1), firstName: 'Juan', lastName: 'Pérez', middleName: null },
        prescriptions: []
      }

      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue(mockNote as any)
      vi.mocked(prisma.medicalNote.update).mockResolvedValue({
        ...mockNote,
        diagnosis: 'Migraña actualizada'
      } as any)

      const request = new NextRequest('http://localhost/api/medical-notes/1', {
        method: 'PATCH',
        body: JSON.stringify({ diagnosis: 'Migraña actualizada' })
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(200)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/medical-notes/1', {
        method: 'PATCH',
        body: JSON.stringify({ diagnosis: 'Test' })
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'RECEPTIONIST', clinicId: BigInt(1) }
      } as any)

      const request = new NextRequest('http://localhost/api/medical-notes/1', {
        method: 'PATCH',
        body: JSON.stringify({ diagnosis: 'Test' })
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(403)
    })
  })
})
