/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT, DELETE } from '@/app/api/imaging-orders/[id]/route'
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
    middleName: null,
    curp: 'ABCD123456EFGH78',
    birthDate: new Date('1990-01-01')
  },
  doctor: {
    id: 'doctor-1',
    name: 'Dr. Smith',
    specialty: 'General',
    licenseNumber: 'LIC123'
  }
}

describe('Imaging Orders [id] API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/imaging-orders/[id]', () => {
    it('should return imaging order by id', async () => {
      vi.mocked(prisma.imagingOrder.findFirst).mockResolvedValue(mockImagingOrder as any)

      const response = await GET(new NextRequest('http://localhost/api/imaging-orders/1'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/imaging-orders/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 404 when imaging order not found', async () => {
      vi.mocked(prisma.imagingOrder.findFirst).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/imaging-orders/999'), {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.imagingOrder.findFirst).mockRejectedValue(new Error('DB error'))

      const response = await GET(new NextRequest('http://localhost/api/imaging-orders/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(500)
    })
  })

  describe('PUT /api/imaging-orders/[id]', () => {
    it('should update imaging order successfully', async () => {
      vi.mocked(prisma.imagingOrder.findFirst).mockResolvedValue(mockImagingOrder as any)
      vi.mocked(prisma.imagingOrder.update).mockResolvedValue({
        ...mockImagingOrder,
        status: 'COMPLETED',
        completedAt: new Date()
      } as any)

      const request = new NextRequest('http://localhost/api/imaging-orders/1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'COMPLETED' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('COMPLETED')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/imaging-orders/1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'COMPLETED' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'RECEPTIONIST', clinicId: BigInt(1) }
      } as any)

      const request = new NextRequest('http://localhost/api/imaging-orders/1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'COMPLETED' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost/api/imaging-orders/1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'INVALID' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 when imaging order not found', async () => {
      vi.mocked(prisma.imagingOrder.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/imaging-orders/999', {
        method: 'PUT',
        body: JSON.stringify({ status: 'COMPLETED' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should set completedAt when status is COMPLETED', async () => {
      vi.mocked(prisma.imagingOrder.findFirst).mockResolvedValue(mockImagingOrder as any)
      vi.mocked(prisma.imagingOrder.update).mockResolvedValue({
        ...mockImagingOrder,
        status: 'COMPLETED',
        completedAt: new Date()
      } as any)

      const request = new NextRequest('http://localhost/api/imaging-orders/1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'COMPLETED' })
      })

      await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(prisma.imagingOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            completedAt: expect.any(Date)
          })
        })
      )
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.imagingOrder.findFirst).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/imaging-orders/1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'COMPLETED' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(500)
    })
  })

  describe('DELETE /api/imaging-orders/[id]', () => {
    it('should delete imaging order successfully', async () => {
      vi.mocked(prisma.imagingOrder.findFirst).mockResolvedValue(mockImagingOrder as any)
      vi.mocked(prisma.imagingOrder.delete).mockResolvedValue(mockImagingOrder as any)

      const response = await DELETE(new NextRequest('http://localhost/api/imaging-orders/1'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Imaging order deleted')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await DELETE(new NextRequest('http://localhost/api/imaging-orders/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'RECEPTIONIST', clinicId: BigInt(1) }
      } as any)

      const response = await DELETE(new NextRequest('http://localhost/api/imaging-orders/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(403)
    })

    it('should return 404 when imaging order not found', async () => {
      vi.mocked(prisma.imagingOrder.findFirst).mockResolvedValue(null)

      const response = await DELETE(new NextRequest('http://localhost/api/imaging-orders/999'), {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.imagingOrder.findFirst).mockRejectedValue(new Error('DB error'))

      const response = await DELETE(new NextRequest('http://localhost/api/imaging-orders/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(500)
    })
  })
})
