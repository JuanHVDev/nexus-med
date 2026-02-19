/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/patients/[id]/emergency-contacts/route'
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
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn()
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
  firstName: 'John',
  lastName: 'Doe',
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

describe('Emergency Contacts API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/patients/[id]/emergency-contacts', () => {
    it('should return emergency contacts for patient', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as any)
      vi.mocked(prisma.emergencyContact.findMany).mockResolvedValue([mockContact] as any)

      const response = await GET(new NextRequest('http://localhost/api/patients/1/emergency-contacts'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/patients/1/emergency-contacts'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/patients/999/emergency-contacts'), {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should order contacts by isPrimary', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as any)
      vi.mocked(prisma.emergencyContact.findMany).mockResolvedValue([mockContact] as any)

      await GET(new NextRequest('http://localhost/api/patients/1/emergency-contacts'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(prisma.emergencyContact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { isPrimary: 'desc' }
        })
      )
    })
  })

  describe('POST /api/patients/[id]/emergency-contacts', () => {
    it('should create emergency contact successfully', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as any)
      vi.mocked(prisma.emergencyContact.updateMany).mockResolvedValue({ count: 0 })
      vi.mocked(prisma.emergencyContact.create).mockResolvedValue(mockContact as any)

      const request = new NextRequest('http://localhost/api/patients/1/emergency-contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Jane Doe',
          relation: 'Spouse',
          phone: '1234567890',
          isPrimary: true
        })
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/patients/1/emergency-contacts', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'PATIENT', clinicId: BigInt(1) }
      } as any)

      const request = new NextRequest('http://localhost/api/patients/1/emergency-contacts', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(403)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/patients/999/emergency-contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Jane Doe',
          relation: 'Spouse',
          phone: '1234567890'
        })
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should unset other primary contacts when isPrimary is true', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(mockPatient as any)
      vi.mocked(prisma.emergencyContact.updateMany).mockResolvedValue({ count: 1 })
      vi.mocked(prisma.emergencyContact.create).mockResolvedValue(mockContact as any)

      const request = new NextRequest('http://localhost/api/patients/1/emergency-contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Jane Doe',
          relation: 'Spouse',
          phone: '1234567890',
          isPrimary: true
        })
      })

      await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(prisma.emergencyContact.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { patientId: BigInt(1), isPrimary: true },
          data: { isPrimary: false }
        })
      )
    })
  })
})
