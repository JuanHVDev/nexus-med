import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Integration Flow - Appointment to Calendar', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  const mockPatient = {
    id: 'patient-test-1',
    firstName: 'Juan',
    lastName: 'Perez',
  }

  const mockDoctor = {
    id: 'doctor-test-1',
    name: 'Dr. Maria Garcia',
    specialty: 'MEDICINA_GENERAL',
  }

  const mockAppointment = {
    id: 'appointment-test-1',
    patientId: mockPatient.id,
    doctorId: mockDoctor.id,
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    reason: 'Consulta general',
    status: 'SCHEDULED',
    patient: mockPatient,
    doctor: mockDoctor,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockCalendarData = {
    events: [
      {
        id: mockAppointment.id,
        title: `${mockPatient.firstName} ${mockPatient.lastName} - ${mockAppointment.reason}`,
        start: mockAppointment.date,
        end: new Date(new Date(mockAppointment.date).getTime() + 30 * 60 * 1000).toISOString(),
        patientId: mockPatient.id,
        doctorId: mockDoctor.id,
        status: mockAppointment.status,
      },
    ],
  }

  it('should create appointment and reflect in calendar', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAppointment }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCalendarData,
      } as Response)

    // Create appointment
    const createResponse = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: mockPatient.id,
        doctorId: mockDoctor.id,
        date: mockAppointment.date,
        reason: mockAppointment.reason,
      }),
    })

    const createData = await createResponse.json()
    expect(createResponse.ok).toBe(true)
    expect(createData.data.patientId).toBe(mockPatient.id)

    // Fetch calendar data
    const calendarResponse = await fetch('/api/appointments/calendar')
    const calendarData = await calendarResponse.json()

    expect(calendarResponse.ok).toBe(true)
    expect(calendarData.events).toHaveLength(1)
    expect(calendarData.events[0].patientId).toBe(mockPatient.id)
  })

  it('should update appointment and reflect in calendar', async () => {
    const updatedDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    const updatedAppointment = { ...mockAppointment, date: updatedDate }
    
    const updatedCalendarData = {
      events: [
        {
          ...mockCalendarData.events[0],
          start: updatedDate,
        },
      ],
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updatedAppointment }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedCalendarData,
      } as Response)

    // Update appointment
    const updateResponse = await fetch(`/api/appointments/${mockAppointment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: updatedDate }),
    })

    const updateData = await updateResponse.json()
    expect(updateResponse.ok).toBe(true)

    // Fetch calendar data
    const calendarResponse = await fetch('/api/appointments/calendar')
    const calendarData = await calendarResponse.json()

    expect(calendarData.events[0].start).toBe(updatedDate)
  })

  it('should cancel appointment and remove from calendar', async () => {
    const cancelledAppointment = { ...mockAppointment, status: 'CANCELLED' }
    
    const emptyCalendarData = {
      events: [],
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: cancelledAppointment }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => emptyCalendarData,
      } as Response)

    // Cancel appointment
    const cancelResponse = await fetch(`/api/appointments/${mockAppointment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    })

    expect(cancelResponse.ok).toBe(true)

    // Fetch calendar data
    const calendarResponse = await fetch('/api/appointments/calendar')
    const calendarData = await calendarResponse.json()

    expect(calendarData.events).toHaveLength(0)
  })

  it('should create multiple appointments and display all in calendar', async () => {
    const appointment2 = {
      ...mockAppointment,
      id: 'appointment-test-2',
      patientId: 'patient-test-2',
      patient: { id: 'patient-test-2', firstName: 'Maria', lastName: 'Garcia' },
    }

    const multiCalendarData = {
      events: [
        {
          id: mockAppointment.id,
          title: `${mockPatient.firstName} ${mockPatient.lastName} - ${mockAppointment.reason}`,
          start: mockAppointment.date,
          patientId: mockPatient.id,
        },
        {
          id: appointment2.id,
          title: `${appointment2.patient.firstName} ${appointment2.patient.lastName} - ${appointment2.reason}`,
          start: appointment2.date,
          patientId: appointment2.patientId,
        },
      ],
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAppointment }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: appointment2 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => multiCalendarData,
      } as Response)

    // Create first appointment
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockAppointment),
    })

    // Create second appointment
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment2),
    })

    // Fetch calendar data
    const calendarResponse = await fetch('/api/appointments/calendar')
    const calendarData = await calendarResponse.json()

    expect(calendarData.events).toHaveLength(2)
    expect(calendarData.events.map((e: any) => e.patientId)).toContain(mockPatient.id)
    expect(calendarData.events.map((e: any) => e.patientId)).toContain(appointment2.patientId)
  })

  it('should filter calendar by date range', async () => {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    const filteredCalendarData = {
      events: mockCalendarData.events.filter((event: any) => {
        const eventDate = new Date(event.start)
        return eventDate >= new Date(startOfDay) && eventDate <= new Date(endOfDay)
      }),
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => filteredCalendarData,
    } as Response)

    // Fetch calendar with date filter
    const calendarResponse = await fetch(
      `/api/appointments/calendar?start=${startOfDay}&end=${endOfDay}`
    )
    const calendarData = await calendarResponse.json()

    expect(calendarResponse.ok).toBe(true)
    expect(Array.isArray(calendarData.events)).toBe(true)
  })

  it('should maintain data consistency between appointments and calendar APIs', async () => {
    const appointmentsList = [mockAppointment]

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: appointmentsList, total: 1 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCalendarData,
      } as Response)

    // Fetch appointments list
    const appointmentsResponse = await fetch('/api/appointments')
    const appointmentsData = await appointmentsResponse.json()

    // Fetch calendar data
    const calendarResponse = await fetch('/api/appointments/calendar')
    const calendarData = await calendarResponse.json()

    // Verify consistency
    expect(appointmentsData.total).toBe(calendarData.events.length)
    expect(appointmentsData.data[0].id).toBe(calendarData.events[0].id)
  })

  it('should handle appointment creation with invalid patient', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Patient not found' }),
    } as Response)

    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: 'non-existent-patient',
        doctorId: mockDoctor.id,
        date: mockAppointment.date,
        reason: mockAppointment.reason,
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
    
    const data = await response.json()
    expect(data.error).toBe('Patient not found')
  })

  it('should handle appointment time conflicts', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'Time slot already booked' }),
    } as Response)

    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: 'patient-test-2',
        doctorId: mockDoctor.id,
        date: mockAppointment.date,
        reason: 'Otra consulta',
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(409)
    
    const data = await response.json()
    expect(data.error).toBe('Time slot already booked')
  })

  it('should update dashboard appointment count when creating appointment', async () => {
    const dashboardStats = {
      totalPatients: 1,
      totalAppointments: 1,
      todayAppointments: 1,
      monthlyRevenue: 0,
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAppointment }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => dashboardStats,
      } as Response)

    // Create appointment
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockAppointment),
    })

    // Fetch dashboard stats
    const statsResponse = await fetch('/api/dashboard/stats')
    const statsData = await statsResponse.json()

    expect(statsData.totalAppointments).toBe(1)
    expect(statsData.todayAppointments).toBe(1)
  })
})
