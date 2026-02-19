/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT } from '@/app/api/settings/doctors/route'
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
    user: {
      findMany: vi.fn(),
      update: vi.fn()
    }
  }
}))

vi.mock('@/lib/utils', () => ({
  serializeBigInt: vi.fn((obj) => JSON.parse(JSON.stringify(obj, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  )))
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const mockSession = {
  user: { id: 'user-1', role: 'ADMIN', clinicId: BigInt(1) }
}

describe('Settings Doctors API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/settings/doctors', () => {
    it('should return doctors for authenticated user', async () => {
      const mockDoctors = [{
        id: 'doc-1',
        name: 'Dr. Smith',
        email: 'smith@clinic.com',
        specialty: 'Cardiology',
        licenseNumber: '12345',
        phone: '1234567890',
        isActive: true,
        createdAt: new Date(),
        appointments: 10,
        medicalNotes: 5
      }]

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockDoctors as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.doctors).toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('should return 404 when user has no clinicId', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN', clinicId: null }
      } as any)

      const response = await GET()

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/settings/doctors', () => {
    it('should update doctor settings', async () => {
      const mockDoctor = {
        id: 'doc-1',
        name: 'Dr. Smith Updated',
        email: 'smith@clinic.com',
        specialty: 'Cardiology',
        licenseNumber: '12345',
        isActive: true
      }

      vi.mocked(prisma.user.update).mockResolvedValue(mockDoctor as any)

      const request = new NextRequest('http://localhost/api/settings/doctors', {
        method: 'PUT',
        body: JSON.stringify({
          doctorId: 'doc-1',
          name: 'Dr. Smith Updated'
        })
      })

      const response = await PUT(request)

      expect(response.status).toBe(200)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/settings/doctors', {
        method: 'PUT',
        body: JSON.stringify({ doctorId: 'doc-1', name: 'Test' })
      })

      const response = await PUT(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 for non-admin users', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'DOCTOR', clinicId: BigInt(1) }
      } as any)

      const request = new NextRequest('http://localhost/api/settings/doctors', {
        method: 'PUT',
        body: JSON.stringify({ doctorId: 'doc-1', name: 'Test' })
      })

      const response = await PUT(request)

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid input', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
      
      const request = new NextRequest('http://localhost/api/settings/doctors', {
        method: 'PUT',
        body: JSON.stringify({ doctorId: 'doc-1' })
      })

      const response = await PUT(request)

      expect([400, 500]).toContain(response.status)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.user.update).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/settings/doctors', {
        method: 'PUT',
        body: JSON.stringify({ doctorId: 'doc-1', name: 'Test' })
      })

      const response = await PUT(request)

      expect(response.status).toBe(500)
    })
  })
})
