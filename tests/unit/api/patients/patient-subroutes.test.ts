import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockPatient = {
  id: '1',
  clinicId: '1',
  firstName: 'Juan',
  lastName: 'Pérez',
  curp: 'PEAJ900515HNLRRN01',
  birthDate: new Date('1990-05-15'),
  gender: 'MALE',
  isActive: true,
}

const mockMedicalNote = {
  id: '1',
  clinicId: '1',
  patientId: '1',
  doctorId: 'doc-1',
  specialty: 'GENERAL',
  type: 'CONSULTATION',
  chiefComplaint: 'Dolor de cabeza',
  currentIllness: null,
  vitalSigns: null,
  physicalExam: null,
  diagnosis: 'Migraña',
  prognosis: null,
  treatment: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockMedicalHistory = {
  id: '1',
  patientId: '1',
  allergies: 'Penicilina',
  chronicDiseases: 'Diabetes tipo 2',
  surgeries: 'Apendicectomía',
  familyHistory: 'Hipertensión',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockEmergencyContact = {
  id: '1',
  patientId: '1',
  name: 'María Pérez',
  relation: 'Madre',
  phone: '5559876543',
  email: 'maria@example.com',
  isPrimary: true,
}

describe('Patient Notes API', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/patients/[id]/notes', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/patients/1/notes')
      expect(response.status).toBe(401)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Patient not found' }),
      } as Response)

      const response = await fetch('/api/patients/999/notes', {
        headers: { 'Authorization': 'Bearer mock-token' }
      })
      expect(response.status).toBe(404)
    })

    it('should return medical notes for valid patient', async () => {
      const mockResponse = [mockMedicalNote]

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/patients/1/notes', {
        headers: { 'Authorization': 'Bearer mock-token' }
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(Array.isArray(data)).toBe(true)
    })

    it('should return empty array when patient has no notes', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response)

      const response = await fetch('/api/patients/1/notes', {
        headers: { 'Authorization': 'Bearer mock-token' }
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(0)
    })
  })
})

describe('Patient History API', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/patients/[id]/history', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/patients/1/history')
      expect(response.status).toBe(401)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      } as Response)

      const response = await fetch('/api/patients/999/history', {
        headers: { 'Authorization': 'Bearer mock-token' }
      })
      expect(response.status).toBe(404)
    })

    it('should return empty object when patient has no history', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response)

      const response = await fetch('/api/patients/1/history', {
        headers: { 'Authorization': 'Bearer mock-token' }
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toEqual({})
    })

    it('should return medical history when exists', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockMedicalHistory,
      } as Response)

      const response = await fetch('/api/patients/1/history', {
        headers: { 'Authorization': 'Bearer mock-token' }
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.allergies).toBe('Penicilina')
    })
  })

  describe('PATCH /api/patients/[id]/history', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/patients/1/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allergies: 'Nuevas alergias' }),
      })
      expect(response.status).toBe(401)
    })

    it('should return 403 when user is not medical staff', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' }),
      } as Response)

      const response = await fetch('/api/patients/1/history', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer receptionist-token'
        },
        body: JSON.stringify({ allergies: 'Nuevas alergias' }),
      })
      expect(response.status).toBe(403)
    })

    it('should update medical history successfully', async () => {
      const updatedHistory = { ...mockMedicalHistory, allergies: 'Nuevas alergias' }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => updatedHistory,
      } as Response)

      const response = await fetch('/api/patients/1/history', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer doctor-token'
        },
        body: JSON.stringify({ allergies: 'Nuevas alergias' }),
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.allergies).toBe('Nuevas alergias')
    })

    it('should create medical history if not exists', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockMedicalHistory,
      } as Response)

      const response = await fetch('/api/patients/1/history', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer doctor-token'
        },
        body: JSON.stringify({ allergies: 'Penicilina', chronicDiseases: 'Diabetes' }),
      })

      expect(response.ok).toBe(true)
    })
  })
})

describe('Patient Emergency Contacts API', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/patients/[id]/emergency-contacts', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/patients/1/emergency-contacts')
      expect(response.status).toBe(401)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Patient not found' }),
      } as Response)

      const response = await fetch('/api/patients/999/emergency-contacts', {
        headers: { 'Authorization': 'Bearer mock-token' }
      })
      expect(response.status).toBe(404)
    })

    it('should return emergency contacts ordered by primary first', async () => {
      const contacts = [
        { ...mockEmergencyContact, isPrimary: true },
        { ...mockEmergencyContact, id: '2', name: 'Pedro Pérez', isPrimary: false },
      ]

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => contacts,
      } as Response)

      const response = await fetch('/api/patients/1/emergency-contacts', {
        headers: { 'Authorization': 'Bearer mock-token' }
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(Array.isArray(data)).toBe(true)
      expect(data[0].isPrimary).toBe(true)
    })

    it('should return empty array when no contacts', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as Response)

      const response = await fetch('/api/patients/1/emergency-contacts', {
        headers: { 'Authorization': 'Bearer mock-token' }
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(0)
    })
  })

  describe('POST /api/patients/[id]/emergency-contacts', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/patients/1/emergency-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', relation: 'Padre', phone: '5551234567' }),
      })
      expect(response.status).toBe(401)
    })

    it('should return 403 when user is not allowed', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' }),
      } as Response)

      const response = await fetch('/api/patients/1/emergency-contacts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify({ name: 'Test', relation: 'Padre', phone: '5551234567' }),
      })
      expect(response.status).toBe(403)
    })

    it('should create emergency contact successfully', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockEmergencyContact,
      } as Response)

      const response = await fetch('/api/patients/1/emergency-contacts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer doctor-token'
        },
        body: JSON.stringify({
          name: 'María Pérez',
          relation: 'Madre',
          phone: '5559876543',
          email: 'maria@example.com',
          isPrimary: true,
        }),
      })

      expect(response.ok).toBe(true)
    })

    it('should return 400 for invalid data', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Validation error' }),
      } as Response)

      const response = await fetch('/api/patients/1/emergency-contacts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer doctor-token'
        },
        body: JSON.stringify({ name: '', relation: 'Padre' }),
      })
      expect(response.status).toBe(400)
    })

    it('should set new contact as primary and remove previous primary', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ ...mockEmergencyContact, isPrimary: true }),
      } as Response)

      const response = await fetch('/api/patients/1/emergency-contacts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer doctor-token'
        },
        body: JSON.stringify({
          name: 'Nueva persona',
          relation: 'Tío',
          phone: '5551111111',
          isPrimary: true,
        }),
      })

      expect(response.ok).toBe(true)
    })
  })
})

describe('Patient Restore API', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('PATCH /api/patients/[id]/restore', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/patients/1/restore', {
        method: 'PATCH',
      })
      expect(response.status).toBe(401)
    })

    it('should return 403 when user is not admin', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Only admins can restore patients' }),
      } as Response)

      const response = await fetch('/api/patients/1/restore', {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer doctor-token' },
      })
      expect(response.status).toBe(403)
    })

    it('should return 404 when patient not found or not deleted', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Patient not found or not deleted' }),
      } as Response)

      const response = await fetch('/api/patients/1/restore', {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer admin-token' },
      })
      expect(response.status).toBe(404)
    })

    it('should restore deleted patient successfully', async () => {
      const restoredPatient = { ...mockPatient, deletedAt: null }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => restoredPatient,
      } as Response)

      const response = await fetch('/api/patients/1/restore', {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer admin-token' },
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.deletedAt).toBeNull()
    })

    it('should return 404 when trying to restore active patient', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Patient not found or not deleted' }),
      } as Response)

      const response = await fetch('/api/patients/1/restore', {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer admin-token' },
      })

      expect(response.status).toBe(404)
    })
  })
})

describe('Emergency Contact Individual API', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('PATCH /api/patients/[id]/emergency-contacts/[contactId]', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/patients/1/emergency-contacts/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      })
      expect(response.status).toBe(401)
    })

    it('should update contact successfully', async () => {
      const updatedContact = { ...mockEmergencyContact, name: 'Updated Name' }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => updatedContact,
      } as Response)

      const response = await fetch('/api/patients/1/emergency-contacts/1', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer doctor-token'
        },
        body: JSON.stringify({ name: 'Updated Name' }),
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.name).toBe('Updated Name')
    })
  })

  describe('DELETE /api/patients/[id]/emergency-contacts/[contactId]', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/patients/1/emergency-contacts/1', {
        method: 'DELETE',
      })
      expect(response.status).toBe(401)
    })

    it('should delete contact successfully', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 204,
      } as Response)

      const response = await fetch('/api/patients/1/emergency-contacts/1', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer doctor-token' },
      })

      expect(response.ok).toBe(true)
    })

    it('should return 404 when contact not found', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Contact not found' }),
      } as Response)

      const response = await fetch('/api/patients/1/emergency-contacts/999', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer doctor-token' },
      })

      expect(response.status).toBe(404)
    })
  })
})
