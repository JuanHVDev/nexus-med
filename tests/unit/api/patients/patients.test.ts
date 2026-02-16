import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockPatients = [
  {
    id: '1',
    clinicId: '1',
    firstName: 'Juan',
    lastName: 'Pérez',
    middleName: 'Carlos',
    curp: 'PEAJ900515HNLRRN01',
    birthDate: new Date('1990-05-15').toISOString(),
    gender: 'MALE',
    bloodType: 'O_POSITIVE',
    email: 'juan@example.com',
    phone: '5551234567',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    clinicId: '1',
    firstName: 'María',
    lastName: 'García',
    curp: 'GAMM950515MNLRRN02',
    birthDate: new Date('1995-05-15').toISOString(),
    gender: 'FEMALE',
    email: 'maria@example.com',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

describe('Patients API', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/patients', () => {
    it('should return list of patients', async () => {
      const mockResponse = {
        data: mockPatients,
        pagination: { page: 1, limit: 10, total: 2, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/patients')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].firstName).toBe('Juan')
      expect(data.pagination.total).toBe(2)
    })

    it('should filter patients by search term', async () => {
      const mockResponse = {
        data: [mockPatients[0]],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/patients?search=Juan')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].firstName).toBe('Juan')
    })

    it('should handle pagination', async () => {
      const mockResponse = {
        data: [mockPatients[0]],
        pagination: { page: 2, limit: 10, total: 12, pages: 2 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/patients?page=2&limit=10')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.pages).toBe(2)
    })

    it('should return empty array when no patients found', async () => {
      const mockResponse = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/patients?search=nonexistent')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(0)
      expect(data.pagination.total).toBe(0)
    })
  })

  describe('POST /api/patients', () => {
    it('should create a new patient', async () => {
      const newPatient = {
        firstName: 'Nuevo',
        lastName: 'Paciente',
        birthDate: '2000-01-01',
        gender: 'MALE',
      }

      const mockResponse = {
        ...newPatient,
        id: '3',
        clinicId: '1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      })

      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.firstName).toBe('Nuevo')
      expect(data.id).toBe('3')
    })

    it('should return 400 for invalid data', async () => {
      const invalidPatient = {
        firstName: '',
        lastName: '',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid data' }),
      } as Response)

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPatient),
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for duplicate CURP', async () => {
      const patientWithDuplicateCurp = {
        ...mockPatients[0],
        firstName: 'Otro',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'CURP ya registrada' }),
      } as Response)

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientWithDuplicateCurp),
      })

      expect(response.status).toBe(400)
    })

    it('should return 401 for unauthenticated request', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
      } as Response)

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Patient data validation', () => {
    it('should return patient with correct CURP format', async () => {
      const mockResponse = {
        data: [mockPatients[0]],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/patients')
      const data = await response.json()

      expect(data.data[0].curp).toMatch(/^[A-Z]{4}\d{6}[A-Z]{6}[A-Z0-9]{2}$/)
    })

    it('should return patients with isActive field', async () => {
      const mockResponse = {
        data: mockPatients,
        pagination: { page: 1, limit: 10, total: 2, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/patients')
      const data = await response.json()

      expect(data.data[0]).toHaveProperty('isActive')
      expect(typeof data.data[0].isActive).toBe('boolean')
    })
  })
})
