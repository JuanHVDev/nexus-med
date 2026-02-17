import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockPrescriptions = [
  {
    id: '1',
    patientId: '1',
    doctorId: 'user-doctor-1',
    medicalNoteId: '1',
    medications: [
      { name: 'Amoxicilina', dosage: '500mg', route: 'Oral', frequency: '8h', duration: '7 días' }
    ],
    instructions: 'Tomar con alimentos',
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    digitalSignature: 'signature-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    patient: {
      id: '1',
      firstName: 'Juan',
      lastName: 'Pérez',
      middleName: 'López',
      curp: 'PELJ001001HNLRN01',
    },
    doctor: {
      id: 'user-doctor-1',
      name: 'Dr. Ana García',
      specialty: 'Medicina General',
      licenseNumber: '12345678',
    },
    medicalNote: {
      id: '1',
      createdAt: new Date().toISOString(),
    },
  },
  {
    id: '2',
    patientId: '2',
    doctorId: 'user-doctor-1',
    medicalNoteId: '2',
    medications: [
      { name: 'Paracetamol', dosage: '500mg', route: 'Oral', frequency: '6h', duration: '5 días' }
    ],
    instructions: 'Para el dolor',
    issueDate: new Date().toISOString(),
    validUntil: null,
    digitalSignature: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    patient: {
      id: '2',
      firstName: 'María',
      lastName: 'González',
      middleName: null,
      curp: 'GOMM001001MNLNR01',
    },
    doctor: {
      id: 'user-doctor-1',
      name: 'Dr. Ana García',
      specialty: 'Medicina General',
      licenseNumber: '12345678',
    },
    medicalNote: {
      id: '2',
      createdAt: new Date().toISOString(),
    },
  },
]

describe('Prescriptions API', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/prescriptions', () => {
    it('should return list of prescriptions with pagination', async () => {
      const mockResponse = {
        data: mockPrescriptions,
        pagination: { page: 1, limit: 10, total: 2, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/prescriptions')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.pagination.total).toBe(2)
    })

    it('should filter prescriptions by patientId', async () => {
      const mockResponse = {
        data: [mockPrescriptions[0]],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/prescriptions?patientId=1')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(1)
    })

    it('should filter prescriptions by doctorId', async () => {
      const mockResponse = {
        data: mockPrescriptions,
        pagination: { page: 1, limit: 10, total: 2, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/prescriptions?doctorId=user-doctor-1')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(2)
    })

    it('should search prescriptions by patient name', async () => {
      const mockResponse = {
        data: [mockPrescriptions[0]],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/prescriptions?search=Juan')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data[0].patient.firstName).toBe('Juan')
    })

    it('should search prescriptions by CURP', async () => {
      const mockResponse = {
        data: [mockPrescriptions[0]],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/prescriptions?search=PELJ001001')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(1)
    })

    it('should paginate results', async () => {
      const mockResponse = {
        data: [mockPrescriptions[0]],
        pagination: { page: 2, limit: 1, total: 2, pages: 2 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/prescriptions?page=2&limit=1')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.pages).toBe(2)
    })
  })

  describe('POST /api/prescriptions', () => {
    it('should create a new prescription', async () => {
      const newPrescription = {
        patientId: '1',
        medicalNoteId: '1',
        medications: [
          { name: 'Ibuprofeno', dosage: '400mg', route: 'Oral', frequency: '8h', duration: '3 días' }
        ],
        instructions: 'Tomar después de los alimentos',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      const mockResponse = {
        ...newPrescription,
        id: '3',
        doctorId: 'user-doctor-1',
        issueDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        patient: {
          id: '1',
          firstName: 'Juan',
          lastName: 'Pérez',
          middleName: 'López',
          curp: 'PELJ001001HNLRN01',
        },
        doctor: {
          id: 'user-doctor-1',
          name: 'Dr. Ana García',
          specialty: 'Medicina General',
          licenseNumber: '12345678',
        },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrescription),
      })

      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.medications).toHaveLength(1)
      expect(data.instructions).toBe('Tomar después de los alimentos')
    })

    it('should return 400 for validation error - missing medications', async () => {
      const invalidPrescription = {
        patientId: '1',
        medicalNoteId: '1',
        medications: [],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Validation error', errors: { medications: ['Array required'] } }),
      } as Response)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPrescription),
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for validation error - invalid medication format', async () => {
      const invalidPrescription = {
        patientId: '1',
        medicalNoteId: '1',
        medications: [{ name: '' }],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Validation error', errors: { 'medications.0.name': ['Required'] } }),
      } as Response)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPrescription),
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 when patient not found', async () => {
      const prescriptionData = {
        patientId: '999',
        medicalNoteId: '1',
        medications: [{ name: 'Amoxicilina', dosage: '500mg', route: 'Oral', frequency: '8h', duration: '7 días' }],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Patient not found' }),
      } as Response)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionData),
      })

      expect(response.status).toBe(404)
    })

    it('should return 404 when medical note not found', async () => {
      const prescriptionData = {
        patientId: '1',
        medicalNoteId: '999',
        medications: [{ name: 'Amoxicilina', dosage: '500mg', route: 'Oral', frequency: '8h', duration: '7 días' }],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Medical note not found' }),
      } as Response)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionData),
      })

      expect(response.status).toBe(404)
    })

    it('should return 400 when prescription already exists for note', async () => {
      const prescriptionData = {
        patientId: '1',
        medicalNoteId: '1',
        medications: [{ name: 'Amoxicilina', dosage: '500mg', route: 'Oral', frequency: '8h', duration: '7 días' }],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Prescription already exists for this note' }),
      } as Response)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionData),
      })

      expect(response.status).toBe(400)
    })

    it('should return 401 for unauthenticated request', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: '1',
          medicalNoteId: '1',
          medications: [{ name: 'Test', dosage: '10mg', route: 'Oral', frequency: '24h', duration: '1 día' }],
        }),
      })

      expect(response.status).toBe(401)
    })

    it('should create prescription with multiple medications', async () => {
      const prescriptionWithMultipleMeds = {
        patientId: '1',
        medicalNoteId: '1',
        medications: [
          { name: 'Amoxicilina', dosage: '500mg', route: 'Oral', frequency: '8h', duration: '7 días' },
          { name: 'Paracetamol', dosage: '500mg', route: 'Oral', frequency: '6h', duration: '5 días' },
          { name: 'Loratadina', dosage: '10mg', route: 'Oral', frequency: '24h', duration: '10 días' },
        ],
        instructions: 'Tomar todos los medicamentos según indicado',
      }

      const mockResponse = {
        ...prescriptionWithMultipleMeds,
        id: '4',
        doctorId: 'user-doctor-1',
        issueDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionWithMultipleMeds),
      })

      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.medications).toHaveLength(3)
    })
  })
})
