/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from '@/app/api/patients/[id]/restore/route'
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
  user: { id: 'user-1', role: 'ADMIN', clinicId: BigInt(1) }
}

const mockDeletedPatient = {
  id: BigInt(1),
  clinicId: BigInt(1),
  firstName: 'John',
  lastName: 'Doe',
  deletedAt: new Date('2024-01-01')
}

const mockRestoredPatient = {
  id: BigInt(1),
  clinicId: BigInt(1),
  firstName: 'John',
  lastName: 'Doe',
  deletedAt: null
}

describe('Patient Restore API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('PATCH /api/patients/[id]/restore', () => {
    it('should restore deleted patient successfully', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockDeletedPatient as any)
      vi.mocked(prisma.patient.update).mockResolvedValue(mockRestoredPatient as any)

      const response = await PATCH(new NextRequest('http://localhost/api/patients/1/restore'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('1')
      expect(data.deletedAt).toBeNull()
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await PATCH(new NextRequest('http://localhost/api/patients/1/restore'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 403 for non-admin role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'DOCTOR', clinicId: BigInt(1) }
      } as any)

      const response = await PATCH(new NextRequest('http://localhost/api/patients/1/restore'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(403)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const response = await PATCH(new NextRequest('http://localhost/api/patients/999/restore'), {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should return 404 when patient is not deleted', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const response = await PATCH(new NextRequest('http://localhost/api/patients/1/restore'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(404)
    })

    it('should only search for deleted patients', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockDeletedPatient as any)
      vi.mocked(prisma.patient.update).mockResolvedValue(mockRestoredPatient as any)

      await PATCH(new NextRequest('http://localhost/api/patients/1/restore'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(prisma.patient.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: { not: null }
          })
        })
      )
    })
  })
})
