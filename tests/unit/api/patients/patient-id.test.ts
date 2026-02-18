import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH, DELETE } from '@/app/api/patients/[id]/route'
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
      findFirst: vi.fn(),
      update: vi.fn()
    }
  }
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const mockSession = {
  user: { id: 'user-1', role: 'ADMIN', clinicId: '1' }
}

describe('Patients [id] API Route - Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/patients/[id]', () => {
    it('should return patient by id', async () => {
      const mockPatient = {
        id: BigInt(1),
        clinicId: BigInt(1),
        firstName: 'Juan',
        lastName: 'Pérez',
        medicalHistory: null,
        emergencyContacts: [],
        appointments: 0,
        medicalNotes: 0
      }

      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as any)

      const request = new NextRequest('http://localhost/api/patients/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.firstName).toBe('Juan')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/patients/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(401)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/patients/999')
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/patients/[id]', () => {
    it('should update patient', async () => {
      const updatedPatient = {
        id: BigInt(1),
        clinicId: BigInt(1),
        firstName: 'Juan Carlos',
        lastName: 'Pérez'
      }

      vi.mocked(prisma.patient.findFirst).mockResolvedValue(updatedPatient as any)
      vi.mocked(prisma.patient.update).mockResolvedValue(updatedPatient as any)

      const request = new NextRequest('http://localhost/api/patients/1', {
        method: 'PATCH',
        body: JSON.stringify({ firstName: 'Juan Carlos' })
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(200)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/patients/1', {
        method: 'PATCH',
        body: JSON.stringify({ firstName: 'Test' })
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(401)
    })
  })

  describe('DELETE /api/patients/[id]', () => {
    it('should delete patient (soft delete)', async () => {
      const mockPatient = {
        id: BigInt(1),
        clinicId: BigInt(1),
        firstName: 'Juan'
      }

      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as any)
      vi.mocked(prisma.patient.update).mockResolvedValue(mockPatient as any)

      const request = new NextRequest('http://localhost/api/patients/1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(204)
    })

    it('should return 403 for non-admin users', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'DOCTOR', clinicId: '1' }
      } as any)

      const request = new NextRequest('http://localhost/api/patients/1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(403)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/patients/1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(401)
    })
  })
})
