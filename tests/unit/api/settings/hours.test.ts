/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT } from '@/app/api/settings/hours/route'
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

describe('Settings Hours API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/settings/hours', () => {
    it('should return hours for authenticated user', async () => {
      const mockClinic = {
        workingHours: [
          { day: 1, enabled: true, start: '09:00', end: '18:00' }
        ],
        appointmentDuration: 30
      }

      vi.mocked(prisma.clinic.findUnique).mockResolvedValue(mockClinic as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.appointmentDuration).toBe(30)
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

    it('should return default hours when clinic not found', async () => {
      vi.mocked(prisma.clinic.findUnique).mockResolvedValue(null)

      const response = await GET()

      expect(response.status).toBe(200)
    })
  })

  describe('PUT /api/settings/hours', () => {
    it('should update hours settings', async () => {
      const mockClinic = {
        workingHours: [
          { day: 1, enabled: true, start: '08:00', end: '17:00' }
        ],
        appointmentDuration: 45
      }

      vi.mocked(prisma.clinic.update).mockResolvedValue(mockClinic as any)

      const request = new NextRequest('http://localhost/api/settings/hours', {
        method: 'PUT',
        body: JSON.stringify({
          appointmentDuration: 45,
          workingHours: [{ day: 1, enabled: true, start: '08:00', end: '17:00' }]
        })
      })

      const response = await PUT(request)

      expect(response.status).toBe(200)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/settings/hours', {
        method: 'PUT',
        body: JSON.stringify({ appointmentDuration: 30 })
      })

      const response = await PUT(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 for non-admin users', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'DOCTOR', clinicId: BigInt(1) }
      } as any)

      const request = new NextRequest('http://localhost/api/settings/hours', {
        method: 'PUT',
        body: JSON.stringify({ appointmentDuration: 30 })
      })

      const response = await PUT(request)

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost/api/settings/hours', {
        method: 'PUT',
        body: JSON.stringify({ appointmentDuration: 5 })
      })

      const response = await PUT(request)

      expect(response.status).toBe(400)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.clinic.update).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/settings/hours', {
        method: 'PUT',
        body: JSON.stringify({ appointmentDuration: 30 })
      })

      const response = await PUT(request)

      expect(response.status).toBe(500)
    })
  })
})
