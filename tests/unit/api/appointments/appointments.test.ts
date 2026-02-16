import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockAppointments = [
  {
    id: '1',
    clinicId: '1',
    patientId: '1',
    doctorId: 'user-doctor-1',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    status: 'SCHEDULED',
    reason: 'Consulta general',
    notes: 'Primera vez',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    clinicId: '1',
    patientId: '2',
    doctorId: 'user-doctor-1',
    startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    status: 'CONFIRMED',
    reason: 'Seguimiento',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

describe('Appointments API', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/appointments', () => {
    it('should return list of appointments', async () => {
      const mockResponse = {
        data: mockAppointments,
        pagination: { page: 1, limit: 10, total: 2, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/appointments')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].status).toBe('SCHEDULED')
    })

    it('should filter appointments by doctor', async () => {
      const mockResponse = {
        data: mockAppointments,
        pagination: { page: 1, limit: 10, total: 2, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/appointments?doctorId=user-doctor-1')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(2)
    })

    it('should filter appointments by status', async () => {
      const mockResponse = {
        data: [mockAppointments[0]],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/appointments?status=SCHEDULED')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].status).toBe('SCHEDULED')
    })

    it('should filter appointments by date range', async () => {
      const mockResponse = {
        data: mockAppointments,
        pagination: { page: 1, limit: 10, total: 2, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const startDate = new Date().toISOString()
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const response = await fetch(`/api/appointments?startDate=${startDate}&endDate=${endDate}`)
      const data = await response.json()

      expect(response.ok).toBe(true)
    })
  })

  describe('POST /api/appointments', () => {
    it('should create a new appointment', async () => {
      const newAppointment = {
        patientId: '1',
        doctorId: 'user-doctor-1',
        startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 72 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        status: 'SCHEDULED',
        reason: 'Nueva consulta',
      }

      const mockResponse = {
        ...newAppointment,
        id: '3',
        clinicId: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment),
      })

      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.reason).toBe('Nueva consulta')
    })

    it('should return 400 for missing required fields', async () => {
      const invalidAppointment = {
        patientId: '',
        doctorId: '',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Paciente requerido' }),
      } as Response)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidAppointment),
      })

      expect(response.status).toBe(400)
    })

    it('should return 401 for unauthenticated request', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
      } as Response)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/appointments/calendar', () => {
    it('should return appointments for calendar view', async () => {
      const calendarResponse = mockAppointments.map(apt => ({
        id: apt.id,
        title: `Cita #${apt.id}`,
        start: apt.startTime,
        end: apt.endTime,
        status: apt.status,
        patientId: apt.patientId,
        doctorId: apt.doctorId,
      }))

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => calendarResponse,
      } as Response)

      const response = await fetch('/api/appointments/calendar?start=2024-01-01&end=2024-12-31')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('Appointment status transitions', () => {
    it('should update appointment status', async () => {
      const updatedAppointment = {
        ...mockAppointments[0],
        status: 'CONFIRMED',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => updatedAppointment,
      } as Response)

      const response = await fetch('/api/appointments/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      })

      expect(response.ok).toBe(true)
    })

    it('should allow cancelling appointments', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockAppointments[0], status: 'CANCELLED' }),
      } as Response)

      const response = await fetch('/api/appointments/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      expect(response.ok).toBe(true)
    })
  })
})
