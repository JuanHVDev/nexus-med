/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT } from '@/app/api/settings/clinic/route'
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
    clinic: {
      findUnique: vi.fn(),
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

describe('Settings Clinic API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/settings/clinic', () => {
    it('should return clinic settings for authenticated user', async () => {
      const mockClinic = {
        id: BigInt(1),
        name: 'My Clinic',
        rfc: 'XAXX010101000',
        address: 'Test Address',
        phone: '1234567890',
        email: 'test@clinic.com'
      }

      vi.mocked(prisma.clinic.findUnique).mockResolvedValue(mockClinic as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('My Clinic')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('should return 404 when clinic not found', async () => {
      vi.mocked(prisma.clinic.findUnique).mockResolvedValue(null)

      const response = await GET()

      expect(response.status).toBe(404)
    })

    it('should return 404 when user has no clinicId', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN', clinicId: null }
      } as any)

      const response = await GET()

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/settings/clinic', () => {
    it('should update clinic settings', async () => {
      const mockClinic = {
        id: BigInt(1),
        name: 'Updated Clinic',
        rfc: 'XAXX010101000',
        address: 'New Address',
        phone: '1234567890',
        email: 'updated@clinic.com'
      }

      vi.mocked(prisma.clinic.update).mockResolvedValue(mockClinic as any)

      const request = new NextRequest('http://localhost/api/settings/clinic', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Clinic',
          rfc: 'XAXX010101000',
          address: 'New Address'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Updated Clinic')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/settings/clinic', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test', rfc: 'XAXX010101000' })
      })

      const response = await PUT(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost/api/settings/clinic', {
        method: 'PUT',
        body: JSON.stringify({})
      })

      const response = await PUT(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid RFC', async () => {
      const request = new NextRequest('http://localhost/api/settings/clinic', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test', rfc: 'short' })
      })

      const response = await PUT(request)

      expect(response.status).toBe(400)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.clinic.update).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/settings/clinic', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test', rfc: 'XAXX010101000' })
      })

      const response = await PUT(request)

      expect(response.status).toBe(500)
    })
  })
})
