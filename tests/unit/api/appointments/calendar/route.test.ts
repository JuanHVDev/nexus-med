import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/appointments/calendar/route'
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
      findMany: vi.fn()
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
    middleName: null
  },
  doctor: {
    id: 'doctor-1',
    name: 'Dr. Smith',
    specialty: 'General'
  }
}

describe('Appointments Calendar API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/appointments/calendar', () => {
    it('should return calendar events', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([mockAppointment] as any)

      const request = new NextRequest('http://localhost/api/appointments/calendar?start=2024-01-01&end=2024-01-31')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('1')
      expect(data[0].title).toContain('John Doe')
      expect(data[0].backgroundColor).toBe('#3b82f6')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/appointments/calendar?start=2024-01-01&end=2024-01-31')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 when missing start/end dates', async () => {
      const request = new NextRequest('http://localhost/api/appointments/calendar')
      const response = await GET(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 when missing end date', async () => {
      const request = new NextRequest('http://localhost/api/appointments/calendar?start=2024-01-01')
      const response = await GET(request)

      expect(response.status).toBe(400)
    })

    it('should filter by doctorId', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([mockAppointment] as any)

      const request = new NextRequest('http://localhost/api/appointments/calendar?start=2024-01-01&end=2024-01-31&doctorId=doctor-1')
      await GET(request)

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ doctorId: 'doctor-1' })
        })
      )
    })

    it('should use correct background color for CONFIRMED status', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([{
        ...mockAppointment,
        status: 'CONFIRMED'
      }] as any)

      const request = new NextRequest('http://localhost/api/appointments/calendar?start=2024-01-01&end=2024-01-31')
      const response = await GET(request)
      const data = await response.json()

      expect(data[0].backgroundColor).toBe('#10b981')
    })

    it('should use correct background color for IN_PROGRESS status', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([{
        ...mockAppointment,
        status: 'IN_PROGRESS'
      }] as any)

      const request = new NextRequest('http://localhost/api/appointments/calendar?start=2024-01-01&end=2024-01-31')
      const response = await GET(request)
      const data = await response.json()

      expect(data[0].backgroundColor).toBe('#f59e0b')
    })

    it('should use correct background color for COMPLETED status', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([{
        ...mockAppointment,
        status: 'COMPLETED'
      }] as any)

      const request = new NextRequest('http://localhost/api/appointments/calendar?start=2024-01-01&end=2024-01-31')
      const response = await GET(request)
      const data = await response.json()

      expect(data[0].backgroundColor).toBe('#6b7280')
    })

    it('should use correct background color for CANCELLED status', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([{
        ...mockAppointment,
        status: 'CANCELLED'
      }] as any)

      const request = new NextRequest('http://localhost/api/appointments/calendar?start=2024-01-01&end=2024-01-31')
      const response = await GET(request)
      const data = await response.json()

      expect(data[0].backgroundColor).toBe('#ef4444')
    })

    it('should use correct background color for NO_SHOW status', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([{
        ...mockAppointment,
        status: 'NO_SHOW'
      }] as any)

      const request = new NextRequest('http://localhost/api/appointments/calendar?start=2024-01-01&end=2024-01-31')
      const response = await GET(request)
      const data = await response.json()

      expect(data[0].backgroundColor).toBe('#dc2626')
    })

    it('should include patient middle name in title', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([{
        ...mockAppointment,
        patient: {
          ...mockAppointment.patient,
          middleName: 'Michael'
        }
      }] as any)

      const request = new NextRequest('http://localhost/api/appointments/calendar?start=2024-01-01&end=2024-01-31')
      const response = await GET(request)
      const data = await response.json()

      expect(data[0].title).toContain('John Michael Doe')
    })
  })
})
