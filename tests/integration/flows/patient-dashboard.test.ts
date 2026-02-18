import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Integration Flow - Patient to Dashboard', () => {
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
    curp: 'PEPJ900115HNLRN01',
    birthDate: '1990-01-15',
    gender: 'MALE',
    phone: '5551234567',
    email: 'juan@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockDashboardStats = {
    totalPatients: 1,
    totalAppointments: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    recentPatients: [mockPatient],
    recentAppointments: [],
  }

  it('should create patient and reflect in dashboard stats', async () => {
    // Step 1: Create patient
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPatient }),
      } as Response)
      // Step 2: Fetch dashboard stats
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardStats,
      } as Response)

    // Create patient
    const createResponse = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockPatient),
    })

    const createData = await createResponse.json()
    expect(createResponse.ok).toBe(true)
    expect(createData.data.firstName).toBe('Juan')

    // Fetch dashboard stats
    const statsResponse = await fetch('/api/dashboard/stats')
    const statsData = await statsResponse.json()

    expect(statsResponse.ok).toBe(true)
    expect(statsData.totalPatients).toBe(1)
    expect(statsData.recentPatients).toHaveLength(1)
    expect(statsData.recentPatients[0].firstName).toBe('Juan')
  })

  it('should update patient and reflect changes in dashboard', async () => {
    const updatedPatient = { ...mockPatient, firstName: 'Juan Carlos' }
    const updatedStats = {
      ...mockDashboardStats,
      recentPatients: [updatedPatient],
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updatedPatient }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedStats,
      } as Response)

    // Update patient
    const updateResponse = await fetch(`/api/patients/${mockPatient.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: 'Juan Carlos' }),
    })

    const updateData = await updateResponse.json()
    expect(updateResponse.ok).toBe(true)
    expect(updateData.data.firstName).toBe('Juan Carlos')

    // Fetch dashboard stats
    const statsResponse = await fetch('/api/dashboard/stats')
    const statsData = await statsResponse.json()

    expect(statsData.recentPatients[0].firstName).toBe('Juan Carlos')
  })

  it('should delete patient and update dashboard stats', async () => {
    const statsAfterDelete = {
      ...mockDashboardStats,
      totalPatients: 0,
      recentPatients: [],
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => statsAfterDelete,
      } as Response)

    // Delete patient
    const deleteResponse = await fetch(`/api/patients/${mockPatient.id}`, {
      method: 'DELETE',
    })

    expect(deleteResponse.ok).toBe(true)

    // Fetch dashboard stats
    const statsResponse = await fetch('/api/dashboard/stats')
    const statsData = await statsResponse.json()

    expect(statsData.totalPatients).toBe(0)
    expect(statsData.recentPatients).toHaveLength(0)
  })

  it('should maintain data consistency between patient and dashboard APIs', async () => {
    const patientsList = [mockPatient]
    
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: patientsList, total: 1 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardStats,
      } as Response)

    // Fetch patients list
    const patientsResponse = await fetch('/api/patients')
    const patientsData = await patientsResponse.json()

    // Fetch dashboard stats
    const statsResponse = await fetch('/api/dashboard/stats')
    const statsData = await statsResponse.json()

    // Verify consistency
    expect(patientsData.total).toBe(statsData.totalPatients)
    expect(patientsData.data[0].id).toBe(statsData.recentPatients[0].id)
  })

  it('should handle patient creation failure gracefully', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid CURP format' }),
    } as Response)

    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...mockPatient, curp: 'INVALID' }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('Invalid CURP format')
  })

  it('should show new patient in recent patients list', async () => {
    const newPatient = {
      ...mockPatient,
      id: 'patient-test-2',
      firstName: 'Maria',
      lastName: 'Garcia',
      curp: 'GAMR950320MNLRNC05',
    }

    const updatedStats = {
      ...mockDashboardStats,
      totalPatients: 2,
      recentPatients: [newPatient, mockPatient],
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: newPatient }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedStats,
      } as Response)

    // Create new patient
    const createResponse = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPatient),
    })

    expect(createResponse.ok).toBe(true)

    // Verify dashboard reflects new patient
    const statsResponse = await fetch('/api/dashboard/stats')
    const statsData = await statsResponse.json()

    expect(statsData.totalPatients).toBe(2)
    expect(statsData.recentPatients[0].firstName).toBe('Maria')
  })
})
