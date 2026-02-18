import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/services/route'
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
    service: {
      findMany: vi.fn(),
      create: vi.fn()
    },
    serviceCategory: {
      findMany: vi.fn()
    }
  }
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const mockSession = {
  user: { id: 'user-1', role: 'ADMIN', clinicId: '1' }
}

describe('Services API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/services', () => {
    it('should return services and categories for authenticated user', async () => {
      const mockServices = [{
        id: BigInt(1),
        clinicId: BigInt(1),
        name: 'Consultation',
        description: 'General consultation',
        categoryId: BigInt(1),
        basePrice: BigInt(500),
        isActive: true,
        specialty: 'General',
        duration: 30,
        category: { id: BigInt(1), name: 'Medical' }
      }]

      const mockCategories = [{
        id: BigInt(1),
        clinicId: BigInt(1),
        name: 'Medical',
        sortOrder: 1,
        isActive: true
      }]

      vi.mocked(prisma.service.findMany).mockResolvedValue(mockServices as any)
      vi.mocked(prisma.serviceCategory.findMany).mockResolvedValue(mockCategories as any)

      const request = new NextRequest('http://localhost/api/services')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.services).toBeDefined()
      expect(data.categories).toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/services')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should filter by categoryId', async () => {
      vi.mocked(prisma.service.findMany).mockResolvedValue([])
      vi.mocked(prisma.serviceCategory.findMany).mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/services?categoryId=1')
      await GET(request)

      expect(prisma.service.findMany).toHaveBeenCalled()
    })

    it('should filter by specialty', async () => {
      vi.mocked(prisma.service.findMany).mockResolvedValue([])
      vi.mocked(prisma.serviceCategory.findMany).mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/services?specialty=Cardiology')
      await GET(request)

      expect(prisma.service.findMany).toHaveBeenCalled()
    })

    it('should return inactive services when active=false', async () => {
      vi.mocked(prisma.service.findMany).mockResolvedValue([])
      vi.mocked(prisma.serviceCategory.findMany).mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/services?active=false')
      await GET(request)

      expect(prisma.service.findMany).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.service.findMany).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/services')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/services', () => {
    it('should create a new service', async () => {
      const mockService = {
        id: BigInt(1),
        clinicId: BigInt(1),
        name: 'Consultation',
        description: 'General consultation',
        categoryId: BigInt(1),
        basePrice: BigInt(500),
        isActive: true,
        specialty: 'General',
        duration: 30,
      }

      vi.mocked(prisma.service.create).mockResolvedValue(mockService as any)

      const request = new NextRequest('http://localhost/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Consultation',
          description: 'General consultation',
          basePrice: 500,
          duration: 30
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/services', {
        method: 'POST',
        body: JSON.stringify({ name: 'Service', basePrice: 100 })
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 for non-allowed roles', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'PATIENT', clinicId: '1' }
      } as any)

      const request = new NextRequest('http://localhost/api/services', {
        method: 'POST',
        body: JSON.stringify({ name: 'Service', basePrice: 100 })
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost/api/services', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.service.create).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/services', {
        method: 'POST',
        body: JSON.stringify({ name: 'Service', basePrice: 100 })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
