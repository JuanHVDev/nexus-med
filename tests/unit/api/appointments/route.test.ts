/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/appointments/route'
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
    appointment: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn()
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
  user: { id: 'user-1', role: 'ADMIN', clinicId: BigInt(1) }
}

const mockAppointment = {
  id: BigInt(1),
  clinicId: BigInt(1),
  patientId: BigInt(1),
  doctorId: 'doctor-1',
  startTime: new Date('2024-01-15T10:00:00Z'),
  endTime: new Date('2024-01-15T11:00:00Z'),
  status: 'SCHEDULED',
  reason: 'Checkup',
  patient: {
    id: BigInt(1),
    firstName: 'John',
    lastName: 'Doe',
    middleName: null,
    phone: '1234567890'
  },
  doctor: {
    id: 'doctor-1',
    name: 'Dr. Smith',
    specialty: 'General'
  }
}

describe('Appointments API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/appointments', () => {
    it('should return appointments for authenticated user', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([mockAppointment] as any)
      vi.mocked(prisma.appointment.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/appointments')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.pagination.total).toBe(1)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/appointments')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should filter by doctorId', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([mockAppointment] as any)
      vi.mocked(prisma.appointment.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/appointments?doctorId=doctor-1')
      await GET(request)

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ doctorId: 'doctor-1' })
        })
      )
    })

    it('should filter by patientId', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([mockAppointment] as any)
      vi.mocked(prisma.appointment.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/appointments?patientId=1')
      await GET(request)

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ patientId: BigInt(1) })
        })
      )
    })

    it('should filter by status', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([mockAppointment] as any)
      vi.mocked(prisma.appointment.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/appointments?status=SCHEDULED')
      await GET(request)

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'SCHEDULED' })
        })
      )
    })

    it('should filter by date range', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([mockAppointment] as any)
      vi.mocked(prisma.appointment.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/appointments?startDate=2024-01-01&endDate=2024-01-31')
      await GET(request)

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31')
            }
          })
        })
      )
    })
  })

  describe('POST /api/appointments', () => {
    it('should create appointment successfully', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue({ id: BigInt(1) } as any)
      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.appointment.create).mockResolvedValue(mockAppointment as any)

      const request = new NextRequest('http://localhost/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          doctorId: 'doctor-1',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
          status: 'SCHEDULED',
          reason: 'Checkup'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/appointments', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'PATIENT', clinicId: BigInt(1) }
      } as any)

      const request = new NextRequest('http://localhost/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          doctorId: 'doctor-1',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
          status: 'SCHEDULED'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          doctorId: 'doctor-1',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
          status: 'SCHEDULED'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should return 400 when end time is before start time', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue({ id: BigInt(1) } as any)

      const request = new NextRequest('http://localhost/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          doctorId: 'doctor-1',
          startTime: '2024-01-15T11:00:00Z',
          endTime: '2024-01-15T10:00:00Z',
          status: 'SCHEDULED'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 409 when conflicting appointment exists', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue({ id: BigInt(1) } as any)
      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(mockAppointment as any)

      const request = new NextRequest('http://localhost/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          doctorId: 'doctor-1',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
          status: 'SCHEDULED'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(409)
    })
  })
})
