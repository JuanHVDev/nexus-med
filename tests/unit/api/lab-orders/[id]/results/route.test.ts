import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/lab-orders/[id]/results/route'
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
    labOrder: {
      findFirst: vi.fn(),
      update: vi.fn()
    },
    labResult: {
      create: vi.fn()
    }
  }
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const mockSession = {
  user: { id: 'user-1', role: 'DOCTOR', clinicId: BigInt(1) }
}

const mockLabOrder = {
  id: BigInt(1),
  clinicId: BigInt(1),
  patientId: BigInt(1),
  status: 'PENDING'
}

const mockLabResult = {
  id: BigInt(1),
  labOrderId: BigInt(1),
  testName: 'CBC',
  result: 'Normal',
  unit: null,
  referenceRange: null,
  flag: null,
  resultDate: new Date()
}

describe('Lab Orders Results API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('POST /api/lab-orders/[id]/results', () => {
    it('should create lab results successfully', async () => {
      vi.mocked(prisma.labOrder.findFirst).mockResolvedValue(mockLabOrder as any)
      vi.mocked(prisma.labResult.create).mockResolvedValue(mockLabResult as any)
      vi.mocked(prisma.labOrder.update).mockResolvedValue({
        ...mockLabOrder,
        status: 'COMPLETED'
      } as any)

      const request = new NextRequest('http://localhost/api/lab-orders/1/results', {
        method: 'POST',
        body: JSON.stringify({
          results: [{
            testName: 'CBC',
            result: 'Normal',
            unit: 'g/dL',
            referenceRange: '12-16'
          }]
        })
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/lab-orders/1/results', {
        method: 'POST',
        body: JSON.stringify({ results: [] })
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'RECEPTIONIST', clinicId: BigInt(1) }
      } as any)

      const request = new NextRequest('http://localhost/api/lab-orders/1/results', {
        method: 'POST',
        body: JSON.stringify({ results: [] })
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost/api/lab-orders/1/results', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 when lab order not found', async () => {
      vi.mocked(prisma.labOrder.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/lab-orders/999/results', {
        method: 'POST',
        body: JSON.stringify({
          results: [{ testName: 'CBC' }]
        })
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should update lab order status to COMPLETED', async () => {
      vi.mocked(prisma.labOrder.findFirst).mockResolvedValue(mockLabOrder as any)
      vi.mocked(prisma.labResult.create).mockResolvedValue(mockLabResult as any)
      vi.mocked(prisma.labOrder.update).mockResolvedValue({
        ...mockLabOrder,
        status: 'COMPLETED'
      } as any)

      const request = new NextRequest('http://localhost/api/lab-orders/1/results', {
        method: 'POST',
        body: JSON.stringify({
          results: [{ testName: 'CBC', result: 'Normal' }]
        })
      })

      await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(prisma.labOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'COMPLETED' }
        })
      )
    })

    it('should set resultDate when result is provided', async () => {
      vi.mocked(prisma.labOrder.findFirst).mockResolvedValue(mockLabOrder as any)
      vi.mocked(prisma.labResult.create).mockResolvedValue(mockLabResult as any)
      vi.mocked(prisma.labOrder.update).mockResolvedValue({
        ...mockLabOrder,
        status: 'COMPLETED'
      } as any)

      const request = new NextRequest('http://localhost/api/lab-orders/1/results', {
        method: 'POST',
        body: JSON.stringify({
          results: [{ testName: 'CBC', result: 'Normal' }]
        })
      })

      await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(prisma.labResult.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resultDate: expect.any(Date)
          })
        })
      )
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.labOrder.findFirst).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/lab-orders/1/results', {
        method: 'POST',
        body: JSON.stringify({
          results: [{ testName: 'CBC' }]
        })
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(500)
    })
  })
})
