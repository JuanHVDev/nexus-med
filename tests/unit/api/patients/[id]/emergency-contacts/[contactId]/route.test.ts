/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DELETE } from '@/app/api/patients/[id]/emergency-contacts/[contactId]/route'
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
    emergencyContact: {
      findFirst: vi.fn(),
      delete: vi.fn()
    }
  }
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const mockSession = {
  user: { id: 'user-1', role: 'ADMIN', clinicId: BigInt(1) }
}

const mockPatient = {
  id: BigInt(1),
  clinicId: BigInt(1),
  deletedAt: null
}

const mockContact = {
  id: BigInt(1),
  patientId: BigInt(1),
  name: 'Jane Doe',
  relation: 'Spouse',
  phone: '1234567890',
  isPrimary: true
}

describe('Emergency Contact [contactId] API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('DELETE /api/patients/[id]/emergency-contacts/[contactId]', () => {
    it('should delete emergency contact successfully', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as any)
      vi.mocked(prisma.emergencyContact.findFirst).mockResolvedValue(mockContact as any)
      vi.mocked(prisma.emergencyContact.delete).mockResolvedValue(mockContact as any)

      const response = await DELETE(
        new NextRequest('http://localhost/api/patients/1/emergency-contacts/1'),
        { params: Promise.resolve({ id: '1', contactId: '1' }) }
      )

      expect(response.status).toBe(204)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await DELETE(
        new NextRequest('http://localhost/api/patients/1/emergency-contacts/1'),
        { params: Promise.resolve({ id: '1', contactId: '1' }) }
      )

      expect(response.status).toBe(401)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const response = await DELETE(
        new NextRequest('http://localhost/api/patients/999/emergency-contacts/1'),
        { params: Promise.resolve({ id: '999', contactId: '1' }) }
      )

      expect(response.status).toBe(404)
    })

    it('should return 404 when contact not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as any)
      vi.mocked(prisma.emergencyContact.findFirst).mockResolvedValue(null)

      const response = await DELETE(
        new NextRequest('http://localhost/api/patients/1/emergency-contacts/999'),
        { params: Promise.resolve({ id: '1', contactId: '999' }) }
      )

      expect(response.status).toBe(404)
    })
  })
})
