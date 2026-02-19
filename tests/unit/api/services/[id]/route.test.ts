/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT, DELETE } from '@/app/api/services/[id]/route'
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
      findFirst: vi.fn(),
      update: vi.fn(),
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

const mockService = {
  id: BigInt(1),
  clinicId: BigInt(1),
  name: 'General Consultation',
  description: 'Standard consultation',
  categoryId: BigInt(1),
  basePrice: 500,
  duration: 30,
  isActive: true,
  category: {
    id: BigInt(1),
    name: 'Consultations'
  }
}

describe('Services [id] API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/services/[id]', () => {
    it('should return service by id', async () => {
      vi.mocked(prisma.service.findFirst).mockResolvedValue(mockService as any)

      const response = await GET(new NextRequest('http://localhost/api/services/1'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('1')
      expect(data.name).toBe('General Consultation')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/services/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 404 when service not found', async () => {
      vi.mocked(prisma.service.findFirst).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/services/999'), {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should include category in response', async () => {
      vi.mocked(prisma.service.findFirst).mockResolvedValue(mockService as any)

      const response = await GET(new NextRequest('http://localhost/api/services/1'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(data.category).toBeDefined()
      expect(data.category.name).toBe('Consultations')
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.service.findFirst).mockRejectedValue(new Error('DB error'))

      const response = await GET(new NextRequest('http://localhost/api/services/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(500)
    })
  })

  describe('PUT /api/services/[id]', () => {
    it('should update service successfully', async () => {
      vi.mocked(prisma.service.findFirst).mockResolvedValue(mockService as any)
      vi.mocked(prisma.service.update).mockResolvedValue({
        ...mockService,
        name: 'Updated Service'
      } as any)

      const request = new NextRequest('http://localhost/api/services/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Service' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Updated Service')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/services/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'DOCTOR', clinicId: BigInt(1) }
      } as any)

      const request = new NextRequest('http://localhost/api/services/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost/api/services/1', {
        method: 'PUT',
        body: JSON.stringify({ name: '' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 when service not found', async () => {
      vi.mocked(prisma.service.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/services/999', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should update basePrice', async () => {
      vi.mocked(prisma.service.findFirst).mockResolvedValue(mockService as any)
      vi.mocked(prisma.service.update).mockResolvedValue({
        ...mockService,
        basePrice: 600
      } as any)

      const request = new NextRequest('http://localhost/api/services/1', {
        method: 'PUT',
        body: JSON.stringify({ basePrice: 600 })
      })

      await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(prisma.service.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ basePrice: 600 })
        })
      )
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.service.findFirst).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/services/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(500)
    })
  })

  describe('DELETE /api/services/[id]', () => {
    it('should delete service successfully', async () => {
      vi.mocked(prisma.service.findFirst).mockResolvedValue(mockService as any)
      vi.mocked(prisma.service.delete).mockResolvedValue(mockService as any)

      const response = await DELETE(new NextRequest('http://localhost/api/services/1'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Service deleted')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await DELETE(new NextRequest('http://localhost/api/services/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'DOCTOR', clinicId: BigInt(1) }
      } as any)

      const response = await DELETE(new NextRequest('http://localhost/api/services/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(403)
    })

    it('should return 404 when service not found', async () => {
      vi.mocked(prisma.service.findFirst).mockResolvedValue(null)

      const response = await DELETE(new NextRequest('http://localhost/api/services/999'), {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.service.findFirst).mockRejectedValue(new Error('DB error'))

      const response = await DELETE(new NextRequest('http://localhost/api/services/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(500)
    })
  })
})
