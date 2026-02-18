import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/services/categories/route'
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
    serviceCategory: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn()
    }
  }
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const mockSession = {
  user: { id: 'user-1', role: 'ADMIN', clinicId: BigInt(1) }
}

const mockCategory = {
  id: BigInt(1),
  clinicId: BigInt(1),
  name: 'Consultations',
  description: 'Medical consultations',
  color: '#3b82f6',
  sortOrder: 1,
  services: [
    { id: '1', name: 'General Consultation', isActive: true }
  ]
}

describe('Services Categories API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/services/categories', () => {
    it('should return categories for authenticated user', async () => {
      vi.mocked(prisma.serviceCategory.findMany).mockResolvedValue([mockCategory] as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.categories).toHaveLength(1)
      expect(data.categories[0].id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('should include services in response', async () => {
      vi.mocked(prisma.serviceCategory.findMany).mockResolvedValue([mockCategory] as any)

      const response = await GET()
      const data = await response.json()

      expect(data.categories[0].services).toHaveLength(1)
    })

    it('should order by sortOrder', async () => {
      vi.mocked(prisma.serviceCategory.findMany).mockResolvedValue([mockCategory] as any)

      await GET()

      expect(prisma.serviceCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { sortOrder: 'asc' }
        })
      )
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.serviceCategory.findMany).mockRejectedValue(new Error('DB error'))

      const response = await GET()

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/services/categories', () => {
    it('should create category successfully', async () => {
      vi.mocked(prisma.serviceCategory.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.serviceCategory.create).mockResolvedValue(mockCategory as any)

      const request = new NextRequest('http://localhost/api/services/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Consultations',
          description: 'Medical consultations',
          color: '#3b82f6'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/services/categories', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'DOCTOR', clinicId: BigInt(1) }
      } as any)

      const request = new NextRequest('http://localhost/api/services/categories', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost/api/services/categories', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for missing name', async () => {
      const request = new NextRequest('http://localhost/api/services/categories', {
        method: 'POST',
        body: JSON.stringify({ description: 'Test' })
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should set sortOrder based on existing categories', async () => {
      vi.mocked(prisma.serviceCategory.findFirst).mockResolvedValue({
        ...mockCategory,
        sortOrder: 5
      } as any)
      vi.mocked(prisma.serviceCategory.create).mockResolvedValue(mockCategory as any)

      const request = new NextRequest('http://localhost/api/services/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Category' })
      })

      await POST(request)

      expect(prisma.serviceCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sortOrder: 6
          })
        })
      )
    })

    it('should set sortOrder to 1 when no existing categories', async () => {
      vi.mocked(prisma.serviceCategory.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.serviceCategory.create).mockResolvedValue(mockCategory as any)

      const request = new NextRequest('http://localhost/api/services/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Category' })
      })

      await POST(request)

      expect(prisma.serviceCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sortOrder: 1
          })
        })
      )
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.serviceCategory.findFirst).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/services/categories', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
