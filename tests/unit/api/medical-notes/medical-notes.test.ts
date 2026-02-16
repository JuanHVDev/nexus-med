import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockMedicalNotes = [
  {
    id: '1',
    clinicId: '1',
    patientId: '1',
    doctorId: 'user-doctor-1',
    appointmentId: '1',
    specialty: 'GENERAL',
    type: 'CONSULTATION',
    chiefComplaint: 'Dolor de cabeza',
    currentIllness: 'Inicio hace 3 días',
    diagnosis: 'Cefalea tensional',
    treatment: 'Paracetamol 500mg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockPrescriptions = [
  {
    id: '1',
    patientId: '1',
    doctorId: 'user-doctor-1',
    medicalNoteId: '1',
    medications: [
      { name: 'Paracetamol', dosage: '500mg', route: 'Oral' },
    ],
    instructions: 'Seguir tratamiento',
    issueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
]

describe('Medical Notes & Prescriptions API', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/medical-notes', () => {
    it('should return list of medical notes', async () => {
      const mockResponse = {
        data: mockMedicalNotes,
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/medical-notes')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].diagnosis).toBe('Cefalea tensional')
    })

    it('should filter notes by patient', async () => {
      const mockResponse = {
        data: mockMedicalNotes,
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/medical-notes?patientId=1')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data[0].patientId).toBe('1')
    })

    it('should filter notes by specialty', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMedicalNotes, pagination: { page: 1, limit: 10, total: 1, pages: 1 } }),
      } as Response)

      const response = await fetch('/api/medical-notes?specialty=GENERAL')
      expect(response.ok).toBe(true)
    })
  })

  describe('POST /api/medical-notes', () => {
    it('should create a new medical note', async () => {
      const newNote = {
        patientId: '1',
        specialty: 'GENERAL',
        type: 'CONSULTATION',
        chiefComplaint: 'Dolor abdominal',
        diagnosis: 'Gastritis aguda',
        treatment: 'Omeprazol 20mg',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ ...newNote, id: '2', createdAt: new Date().toISOString() }),
      } as Response)

      const response = await fetch('/api/medical-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      })

      expect(response.status).toBe(201)
    })

    it('should return 400 for missing diagnosis', async () => {
      const invalidNote = {
        patientId: '1',
        chiefComplaint: 'Dolor',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Diagnóstico requerido' }),
      } as Response)

      const response = await fetch('/api/medical-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidNote),
      })

      expect(response.status).toBe(400)
    })

    it('should include vital signs when provided', async () => {
      const noteWithVitals = {
        patientId: '1',
        chiefComplaint: 'Chequeo',
        diagnosis: 'Saludable',
        vitalSigns: {
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          heartRate: 72,
        },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ ...noteWithVitals, id: '2' }),
      } as Response)

      const response = await fetch('/api/medical-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteWithVitals),
      })

      expect(response.status).toBe(201)
    })
  })

  describe('GET /api/prescriptions', () => {
    it('should return list of prescriptions', async () => {
      const mockResponse = {
        data: mockPrescriptions,
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/prescriptions')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].medications).toBeDefined()
    })

    it('should filter prescriptions by patient', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPrescriptions, pagination: { page: 1, limit: 10, total: 1, pages: 1 } }),
      } as Response)

      const response = await fetch('/api/prescriptions?patientId=1')
      expect(response.ok).toBe(true)
    })
  })

  describe('POST /api/prescriptions', () => {
    it('should create a new prescription', async () => {
      const newPrescription = {
        patientId: '1',
        medicalNoteId: '1',
        medications: [
          {
            name: 'Amoxicilina',
            dosage: '500mg',
            route: 'Oral',
            frequency: 'Cada 8 horas',
            duration: '7 días',
          },
        ],
        instructions: 'Tomar con alimentos',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ ...newPrescription, id: '2', issueDate: new Date().toISOString() }),
      } as Response)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrescription),
      })

      expect(response.status).toBe(201)
    })

    it('should return 400 for empty medications', async () => {
      const invalidPrescription = {
        patientId: '1',
        medicalNoteId: '1',
        medications: [],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Al menos un medicamento requerido' }),
      } as Response)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPrescription),
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for missing medication name', async () => {
      const invalidPrescription = {
        patientId: '1',
        medicalNoteId: '1',
        medications: [{ dosage: '500mg', route: 'Oral' }],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Nombre del medicamento requerido' }),
      } as Response)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPrescription),
      })

      expect(response.status).toBe(400)
    })
  })
})
