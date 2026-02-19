/* eslint-disable @typescript-eslint/no-explicit-any */
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

const mockMedicalNote = {
  id: BigInt(1),
  clinicId: BigInt(1),
  patientId: BigInt(1),
  doctorId: 'user-1',
  appointmentId: BigInt(1),
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
    email: 'smith@test.com',
    specialty: 'General',
    licenseNumber: 'LIC123'
  },
  appointment: {
    id: BigInt(1),
    clinicId: BigInt(1),
    patientId: BigInt(1),
    doctorId: 'user-1',
    startTime: new Date('2024-01-15T10:00:00Z'),
    endTime: new Date('2024-01-15T11:00:00Z'),
    status: 'IN_PROGRESS',
    reason: 'Checkup',
    notes: null
  },
  prescriptions: []
}

describe('Medical Notes [id] API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/medical-notes/[id]', () => {
    it('should return medical note by id', async () => {
      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue(mockMedicalNote as any)

      const response = await GET(new NextRequest('http://localhost/api/medical-notes/1'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/medical-notes/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 404 when medical note not found', async () => {
      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/medical-notes/999'), {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should include appointment in response', async () => {
      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue(mockMedicalNote as any)

      const response = await GET(new NextRequest('http://localhost/api/medical-notes/1'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(data.appointment).toBeDefined()
      expect(data.appointment.id).toBe('1')
    })

    it('should include prescriptions in response', async () => {
      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue(mockMedicalNote as any)

      const response = await GET(new NextRequest('http://localhost/api/medical-notes/1'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(data.prescriptions).toBeDefined()
    })
  })

  describe('PATCH /api/medical-notes/[id]', () => {
    it('should update medical note successfully', async () => {
      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue(mockMedicalNote as any)
      vi.mocked(prisma.medicalNote.update).mockResolvedValue({
        ...mockMedicalNote,
        diagnosis: 'Updated diagnosis'
      } as any)
      vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/medical-notes/1', {
        method: 'PATCH',
        body: JSON.stringify({ diagnosis: 'Updated diagnosis' })
      })

      const response = await PATCH(request, {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.diagnosis).toBe('Updated diagnosis')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/medical-notes/1', {
        method: 'PATCH',
        body: JSON.stringify({ diagnosis: 'Updated' })
      })

      const response = await PATCH(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'RECEPTIONIST', clinicId: BigInt(1) }
      } as any)

      const request = new NextRequest('http://localhost/api/medical-notes/1', {
        method: 'PATCH',
        body: JSON.stringify({ diagnosis: 'Updated' })
      })

      const response = await PATCH(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(403)
    })

    it('should return 404 when medical note not found', async () => {
      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/medical-notes/999', {
        method: 'PATCH',
        body: JSON.stringify({ diagnosis: 'Updated' })
      })

      const response = await PATCH(request, {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should update appointment status to COMPLETED when note has appointmentId', async () => {
      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue(mockMedicalNote as any)
      vi.mocked(prisma.medicalNote.update).mockResolvedValue(mockMedicalNote as any)
      vi.mocked(prisma.appointment.update).mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/medical-notes/1', {
        method: 'PATCH',
        body: JSON.stringify({ diagnosis: 'Updated' })
      })

      await PATCH(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'COMPLETED' }
        })
      )
    })
  })
})
