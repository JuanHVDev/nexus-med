/* eslint-disable @typescript-eslint/no-explicit-any */
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
    email: 'smith@test.com',
    specialty: 'General',
    licenseNumber: 'LIC123'
  },
  medicalNote: null
}

describe('Appointments [id] API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any as NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>)
    vi.mocked(headers).mockResolvedValue(new Map() as any as Awaited<ReturnType<typeof headers>>)
  })

  describe('GET /api/appointments/[id]', () => {
    it('should return appointment by id', async () => {
      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(mockAppointment as any)

      const response = await GET(new NextRequest('http://localhost/api/appointments/1'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/appointments/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 404 when appointment not found', async () => {
      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/appointments/999'), {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/appointments/[id]', () => {
    it('should update appointment successfully', async () => {
      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(mockAppointment as any)
      vi.mocked(prisma.appointment.update).mockResolvedValue({
        ...mockAppointment,
        status: 'CONFIRMED'
      } as any as Awaited<ReturnType<typeof prisma.appointment.update>>)

      const request = new NextRequest('http://localhost/api/appointments/1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CONFIRMED' })
      })

      const response = await PATCH(request, {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('CONFIRMED')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/appointments/1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CONFIRMED' })
      })

      const response = await PATCH(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'PATIENT', clinicId: BigInt(1) }
      } as any)

      const request = new NextRequest('http://localhost/api/appointments/1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CONFIRMED' })
      })

      const response = await PATCH(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(403)
    })

    it('should return 404 when appointment not found', async () => {
      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/appointments/999', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CONFIRMED' })
      })

      const response = await PATCH(request, {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should return 400 when end time is before start time', async () => {
      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(mockAppointment as any as Awaited<ReturnType<typeof prisma.appointment.findFirst>>)

      const request = new NextRequest('http://localhost/api/appointments/1', {
        method: 'PATCH',
        body: JSON.stringify({
          startTime: '2024-01-15T11:00:00Z',
          endTime: '2024-01-15T10:00:00Z'
        })
      })

      const response = await PATCH(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/appointments/[id]', () => {
    it('should cancel appointment successfully', async () => {
      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(mockAppointment as any as Awaited<ReturnType<typeof prisma.appointment.findFirst>>)
      vi.mocked(prisma.appointment.update).mockResolvedValue({
        ...mockAppointment,
        status: 'CANCELLED'
      } as any as Awaited<ReturnType<typeof prisma.appointment.update>>)

      const response = await DELETE(new NextRequest('http://localhost/api/appointments/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(204)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await DELETE(new NextRequest('http://localhost/api/appointments/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'PATIENT', clinicId: BigInt(1) }
      } as any as NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>)

      const response = await DELETE(new NextRequest('http://localhost/api/appointments/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(403)
    })

    it('should return 404 when appointment not found', async () => {
      vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)

      const response = await DELETE(new NextRequest('http://localhost/api/appointments/999'), {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })
  })
})
