/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/imaging-orders/route'
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
    imagingOrder: {
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

const mockImagingOrder = {
  id: BigInt(1),
  clinicId: BigInt(1),
  patientId: BigInt(1),
  doctorId: 'doctor-1',
  medicalNoteId: null,
  studyType: 'XRAY',
  bodyPart: 'Chest',
  reason: 'Cough',
  clinicalNotes: null,
  status: 'PENDING',
  orderDate: new Date('2024-01-15'),
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
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

describe('Imaging Orders API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/imaging-orders', () => {
    it('should return imaging orders for authenticated user', async () => {
      vi.mocked(prisma.imagingOrder.findMany).mockResolvedValue([mockImagingOrder] as any)

      const request = new NextRequest('http://localhost/api/imaging-orders')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/imaging-orders')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should filter by patientId', async () => {
      vi.mocked(prisma.imagingOrder.findMany).mockResolvedValue([mockImagingOrder] as any)

      const request = new NextRequest('http://localhost/api/imaging-orders?patientId=1')
      await GET(request)

      expect(prisma.imagingOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ patientId: BigInt(1) })
        })
      )
    })

    it('should filter by status', async () => {
      vi.mocked(prisma.imagingOrder.findMany).mockResolvedValue([mockImagingOrder] as any)

      const request = new NextRequest('http://localhost/api/imaging-orders?status=PENDING')
      await GET(request)

      expect(prisma.imagingOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' })
        })
      )
    })

    it('should filter by doctorId', async () => {
      vi.mocked(prisma.imagingOrder.findMany).mockResolvedValue([mockImagingOrder] as any)

      const request = new NextRequest('http://localhost/api/imaging-orders?doctorId=doctor-1')
      await GET(request)

      expect(prisma.imagingOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ doctorId: 'doctor-1' })
        })
      )
    })

    it('should filter by studyType', async () => {
      vi.mocked(prisma.imagingOrder.findMany).mockResolvedValue([mockImagingOrder] as any)

      const request = new NextRequest('http://localhost/api/imaging-orders?studyType=XRAY')
      await GET(request)

      expect(prisma.imagingOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ studyType: 'XRAY' })
        })
      )
    })

    it('should filter by medicalNoteId', async () => {
      vi.mocked(prisma.imagingOrder.findMany).mockResolvedValue([mockImagingOrder] as any)

      const request = new NextRequest('http://localhost/api/imaging-orders?medicalNoteId=1')
      await GET(request)

      expect(prisma.imagingOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ medicalNoteId: BigInt(1) })
        })
      )
    })

    it('should filter by date range', async () => {
      vi.mocked(prisma.imagingOrder.findMany).mockResolvedValue([mockImagingOrder] as any)

      const request = new NextRequest('http://localhost/api/imaging-orders?fromDate=2024-01-01&toDate=2024-01-31')
      await GET(request)

      expect(prisma.imagingOrder.findMany).toHaveBeenCalledWith(
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

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.imagingOrder.findMany).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/imaging-orders')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/imaging-orders', () => {
    it('should create imaging order successfully', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue({ id: BigInt(1) } as any)
      vi.mocked(prisma.imagingOrder.create).mockResolvedValue(mockImagingOrder as any)

      const request = new NextRequest('http://localhost/api/imaging-orders', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          doctorId: 'doctor-1',
          studyType: 'XRAY',
          bodyPart: 'Chest',
          reason: 'Cough'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/imaging-orders', {
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

      const request = new NextRequest('http://localhost/api/imaging-orders', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost/api/imaging-orders', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/imaging-orders', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '999',
          doctorId: 'doctor-1',
          studyType: 'XRAY',
          bodyPart: 'Chest'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.patient.findFirst).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/imaging-orders', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          doctorId: 'doctor-1',
          studyType: 'XRAY',
          bodyPart: 'Chest'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
