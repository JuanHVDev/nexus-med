/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/lab-orders/route'
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
      findMany: vi.fn(),
      create: vi.fn()
    },
    patient: {
      findFirst: vi.fn()
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
  doctorId: 'doctor-1',
  medicalNoteId: null,
  tests: ['CBC', 'Glucose'],
  instructions: 'Fasting required',
  status: 'PENDING',
  orderDate: new Date('2024-01-15'),
  createdAt: new Date(),
  updatedAt: new Date(),
  results: [],
  patient: {
    id: BigInt(1),
    firstName: 'John',
    lastName: 'Doe',
    middleName: null
  },
  doctor: {
    id: 'doctor-1',
    name: 'Dr. Smith'
  }
}

describe('Lab Orders API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/lab-orders', () => {
    it('should return lab orders for authenticated user', async () => {
      vi.mocked(prisma.labOrder.findMany).mockResolvedValue([mockLabOrder] as any)

      const request = new NextRequest('http://localhost/api/lab-orders')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/lab-orders')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should filter by patientId', async () => {
      vi.mocked(prisma.labOrder.findMany).mockResolvedValue([mockLabOrder] as any)

      const request = new NextRequest('http://localhost/api/lab-orders?patientId=1')
      await GET(request)

      expect(prisma.labOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ patientId: BigInt(1) })
        })
      )
    })

    it('should filter by status', async () => {
      vi.mocked(prisma.labOrder.findMany).mockResolvedValue([mockLabOrder] as any)

      const request = new NextRequest('http://localhost/api/lab-orders?status=PENDING')
      await GET(request)

      expect(prisma.labOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' })
        })
      )
    })

    it('should filter by doctorId', async () => {
      vi.mocked(prisma.labOrder.findMany).mockResolvedValue([mockLabOrder] as any)

      const request = new NextRequest('http://localhost/api/lab-orders?doctorId=doctor-1')
      await GET(request)

      expect(prisma.labOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ doctorId: 'doctor-1' })
        })
      )
    })

    it('should filter by medicalNoteId', async () => {
      vi.mocked(prisma.labOrder.findMany).mockResolvedValue([mockLabOrder] as any)

      const request = new NextRequest('http://localhost/api/lab-orders?medicalNoteId=1')
      await GET(request)

      expect(prisma.labOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ medicalNoteId: BigInt(1) })
        })
      )
    })

    it('should filter by date range', async () => {
      vi.mocked(prisma.labOrder.findMany).mockResolvedValue([mockLabOrder] as any)

      const request = new NextRequest('http://localhost/api/lab-orders?fromDate=2024-01-01&toDate=2024-01-31')
      await GET(request)

      expect(prisma.labOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orderDate: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31')
            }
          })
        })
      )
    })

    it('should include results in response', async () => {
      vi.mocked(prisma.labOrder.findMany).mockResolvedValue([{
        ...mockLabOrder,
        results: [{ id: BigInt(1), labOrderId: BigInt(1), testName: 'CBC', result: 'Normal' }]
      }] as any)

      const request = new NextRequest('http://localhost/api/lab-orders')
      const response = await GET(request)
      const data = await response.json()

      expect(data[0].results).toHaveLength(1)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.labOrder.findMany).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/lab-orders')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/lab-orders', () => {
    it('should create lab order successfully', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue({ id: BigInt(1) } as any)
      vi.mocked(prisma.labOrder.create).mockResolvedValue(mockLabOrder as any)

      const request = new NextRequest('http://localhost/api/lab-orders', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          doctorId: 'doctor-1',
          tests: [{ name: 'CBC' }, { name: 'Glucose' }],
          instructions: 'Fasting required'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/lab-orders', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'RECEPTIONIST', clinicId: BigInt(1) }
      } as any)

      const request = new NextRequest('http://localhost/api/lab-orders', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost/api/lab-orders', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/lab-orders', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '999',
          doctorId: 'doctor-1',
          tests: [{ name: 'CBC' }]
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.patient.findFirst).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/lab-orders', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          doctorId: 'doctor-1',
          tests: [{ name: 'CBC' }]
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
