import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH, DELETE } from '@/app/api/appointments/[id]/route'
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
      findFirst: vi.fn(),
      update: vi.fn()
    }
  }
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const mockSession = {
  user: { id: 'user-1', role: 'ADMIN', clinicId: '1' }
}

describe('Appointments [id] API Route - Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/appointments/[id]', () => {
    it('should return appointment by id', async () => {
      const mockAppointment = {
        id: BigInt(1),
        clinicId: BigInt(1),
        patientId: BigInt(1),
        doctorId: 'doctor-1',
        startTime: new Date(),
        endTime: new Date(),
        status: 'SCHEDULED',
        patient: { id: BigInt(1), firstName: 'Juan', lastName: 'Pérez', middleName: null, phone: '5551234567' },
        doctor: { id: 'doctor-1', name: 'Dr. Smith', specialty: 'Medicina General', email: 'dr@test.com', licenseNumber: '12345' },
        medicalNote: null
      }

      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(mockAppointment as any)

      const request = new NextRequest('http://localhost/api/appointments/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('SCHEDULED')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/appointments/1')
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(401)
    })

    it('should return 404 when appointment not found', async () => {
      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/appointments/999')
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/appointments/[id]', () => {
    it('should update appointment status', async () => {
      const updatedAppointment = {
        id: BigInt(1),
        clinicId: BigInt(1),
        patientId: BigInt(1),
        doctorId: 'doctor-1',
        status: 'COMPLETED',
        patient: { id: BigInt(1), firstName: 'Juan', lastName: 'Pérez', middleName: null, phone: '5551234567' },
        doctor: { id: 'doctor-1', name: 'Dr. Smith', specialty: 'Medicina General' }
      }

      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(updatedAppointment as any)
      vi.mocked(prisma.appointment.update).mockResolvedValue(updatedAppointment as any)

      const request = new NextRequest('http://localhost/api/appointments/1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' })
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(200)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/appointments/1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' })
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'PATIENT', clinicId: '1' }
      } as any)

      const request = new NextRequest('http://localhost/api/appointments/1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED' })
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid time range', async () => {
      const mockAppointment = {
        id: BigInt(1),
        startTime: new Date('2024-01-15T10:00:00'),
        endTime: new Date('2024-01-15T10:30:00')
      }

      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(mockAppointment as any)

      const request = new NextRequest('http://localhost/api/appointments/1', {
        method: 'PATCH',
        body: JSON.stringify({ startTime: '2024-01-15T10:30:00', endTime: '2024-01-15T10:00:00' })
      })
      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/appointments/[id]', () => {
    it('should cancel appointment', async () => {
      const mockAppointment = { id: BigInt(1), status: 'SCHEDULED' }

      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(mockAppointment as any)
      vi.mocked(prisma.appointment.update).mockResolvedValue({ ...mockAppointment, status: 'CANCELLED' } as any)

      const request = new NextRequest('http://localhost/api/appointments/1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(204)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/appointments/1', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })

      expect(response.status).toBe(401)
    })

    it('should return 404 when appointment not found', async () => {
      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/appointments/999', {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) })

      expect(response.status).toBe(404)
    })
  })
})
