/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH } from '@/app/api/patients/[id]/history/route'
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
    medicalHistory: {
      findUnique: vi.fn(),
      upsert: vi.fn()
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

const mockMedicalHistory = {
  id: BigInt(1),
  patientId: BigInt(1),
  allergies: ['Penicillin'],
  chronicDiseases: ['Diabetes'],
  surgeries: [],
  familyHistory: [],
  medications: []
}

describe('Patient History API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/patients/[id]/history', () => {
    it('should return medical history for patient', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as any)
      vi.mocked(prisma.medicalHistory.findUnique).mockResolvedValue(mockMedicalHistory as any)

      const response = await GET(new NextRequest('http://localhost/api/patients/1/history'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('1')
      expect(data.allergies).toContain('Penicillin')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/patients/1/history'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/patients/999/history'), {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should return empty object when no history', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as any)
      vi.mocked(prisma.medicalHistory.findUnique).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/patients/1/history'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({})
    })
  })

  describe('PATCH /api/patients/[id]/history', () => {
    it('should update medical history successfully', async () => {
      vi.mocked(prisma.medicalHistory.upsert).mockResolvedValue({
        ...mockMedicalHistory,
        allergies: ['Penicillin', 'Aspirin']
      } as any)

      const request = new NextRequest('http://localhost/api/patients/1/history', {
        method: 'PATCH',
        body: JSON.stringify({
          allergies: ['Penicillin', 'Aspirin']
        })
      })

      const response = await PATCH(request, {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.allergies).toContain('Aspirin')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/patients/1/history', {
        method: 'PATCH',
        body: JSON.stringify({})
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

      const request = new NextRequest('http://localhost/api/patients/1/history', {
        method: 'PATCH',
        body: JSON.stringify({})
      })

      const response = await PATCH(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(403)
    })

    it('should use upsert for create or update', async () => {
      vi.mocked(prisma.medicalHistory.upsert).mockResolvedValue(mockMedicalHistory as any)

      const request = new NextRequest('http://localhost/api/patients/1/history', {
        method: 'PATCH',
        body: JSON.stringify({
          allergies: ['Penicillin']
        })
      })

      await PATCH(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(prisma.medicalHistory.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: BigInt(1) }
        })
      )
    })
  })
})
