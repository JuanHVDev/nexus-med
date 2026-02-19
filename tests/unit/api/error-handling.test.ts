import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Patients API Error Handling', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/patients/[id]', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/patients/1')
      
      expect(response.status).toBe(401)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Patient not found' }),
      } as Response)

      const response = await fetch('/api/patients/999999', { 
        headers: { 'Authorization': 'Bearer mock-token' } 
      })
      
      expect(response.status).toBe(404)
    })

    it('should return 404 for invalid patient ID format', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid ID format' }),
      } as Response)

      const response = await fetch('/api/patients/invalid-id')
      
      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /api/patients/[id]', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/patients/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: 'Pedro' }),
      })
      
      expect(response.status).toBe(401)
    })

    it('should return 404 when patient not found for update', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Patient not found' }),
      } as Response)

      const response = await fetch('/api/patients/999999', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({ firstName: 'Pedro' }),
      })
      
      expect(response.status).toBe(404)
    })

    it('should return 400 for invalid data format', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Validation error' }),
      } as Response)

      const response = await fetch('/api/patients/1', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({ email: 'not-an-email' }),
      })
      
      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/patients/[id]', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/patients/1', { method: 'DELETE' })
      
      expect(response.status).toBe(401)
    })

    it('should return 403 when user is not admin', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Only admins can delete patients' }),
      } as Response)

      const response = await fetch('/api/patients/1', { 
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer mock-token' }
      })
      
      expect(response.status).toBe(403)
    })

    it('should return 404 when patient not found for deletion', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Patient not found' }),
      } as Response)

      const response = await fetch('/api/patients/999999', { 
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer admin-token' }
      })
      
      expect(response.status).toBe(404)
    })
  })
})

describe('Appointments API Error Handling', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/appointments/[id]', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/appointments/1')
      
      expect(response.status).toBe(401)
    })

    it('should return 404 when appointment not found', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Appointment not found' }),
      } as Response)

      const response = await fetch('/api/appointments/999999', {
        headers: { 'Authorization': 'Bearer mock-token' }
      })
      
      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/appointments', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: '1', doctorId: '1' }),
      })
      
      expect(response.status).toBe(401)
    })

    it('should return 400 for missing required fields', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Validation error' }),
      } as Response)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({}),
      })
      
      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid date format', async () => {
      const invalidAppointment = {
        patientId: '1',
        doctorId: '1',
        startTime: 'not-a-date',
        endTime: 'also-not-a-date',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid date format' }),
      } as Response)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(invalidAppointment),
      })
      
      expect(response.status).toBe(400)
    })
  })
})

describe('Medical Notes API Error Handling', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/medical-notes/[id]', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/medical-notes/1')
      
      expect(response.status).toBe(401)
    })

    it('should return 404 when medical note not found', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Medical note not found' }),
      } as Response)

      const response = await fetch('/api/medical-notes/999999', {
        headers: { 'Authorization': 'Bearer mock-token' }
      })
      
      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/medical-notes', () => {
    it('should return 400 for missing required fields', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Validation error' }),
      } as Response)

      const response = await fetch('/api/medical-notes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({}),
      })
      
      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid specialty', async () => {
      const invalidNote = {
        patientId: '1',
        specialty: 'INVALID_SPECIALTY',
        chiefComplaint: 'Test',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid specialty' }),
      } as Response)

      const response = await fetch('/api/medical-notes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(invalidNote),
      })
      
      expect(response.status).toBe(400)
    })
  })
})

describe('Prescriptions API Error Handling', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('POST /api/prescriptions', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: '1' }),
      })
      
      expect(response.status).toBe(401)
    })

    it('should return 400 when medications array is empty', async () => {
      const invalidPrescription = {
        patientId: '1',
        medications: [],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'At least one medication required' }),
      } as Response)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(invalidPrescription),
      })
      
      expect(response.status).toBe(400)
    })

    it('should return 400 for medication missing required fields', async () => {
      const invalidMedication = {
        patientId: '1',
        medications: [{ name: 'Aspirin' }],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Validation error' }),
      } as Response)

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(invalidMedication),
      })
      
      expect(response.status).toBe(400)
    })
  })
})

describe('Invoices API Error Handling', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/invoices/[id]', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/invoices/1')
      
      expect(response.status).toBe(401)
    })

    it('should return 404 when invoice not found', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Invoice not found' }),
      } as Response)

      const response = await fetch('/api/invoices/999999', {
        headers: { 'Authorization': 'Bearer mock-token' }
      })
      
      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/invoices', () => {
    it('should return 400 when items array is empty', async () => {
      const invalidInvoice = {
        patientId: '1',
        items: [],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'At least one item required' }),
      } as Response)

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(invalidInvoice),
      })
      
      expect(response.status).toBe(400)
    })

    it('should return 400 for negative price', async () => {
      const invalidInvoice = {
        patientId: '1',
        items: [{ serviceId: '1', quantity: 1, unitPrice: -100 }],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid price' }),
      } as Response)

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(invalidInvoice),
      })
      
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/invoices/[id]/payments', () => {
    it('should return 400 for negative payment amount', async () => {
      const invalidPayment = {
        amount: -50,
        method: 'CASH',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Amount must be positive' }),
      } as Response)

      const response = await fetch('/api/invoices/1/payments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(invalidPayment),
      })
      
      expect(response.status).toBe(400)
    })

    it('should return 400 for zero payment amount', async () => {
      const invalidPayment = {
        amount: 0,
        method: 'CASH',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Amount must be greater than 0' }),
      } as Response)

      const response = await fetch('/api/invoices/1/payments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(invalidPayment),
      })
      
      expect(response.status).toBe(400)
    })
  })
})

describe('Lab Orders API Error Handling', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('POST /api/lab-orders', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: '1' }),
      })
      
      expect(response.status).toBe(401)
    })

    it('should return 400 when tests array is empty', async () => {
      const invalidOrder = {
        patientId: '1',
        doctorId: '1',
        tests: [],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'At least one test required' }),
      } as Response)

      const response = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(invalidOrder),
      })
      
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/lab-orders/[id]/results', () => {
    it('should return 404 when lab order not found', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Lab order not found' }),
      } as Response)

      const response = await fetch('/api/lab-orders/999999/results', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({ results: [] }),
      })
      
      expect(response.status).toBe(404)
    })
  })
})

describe('Imaging Orders API Error Handling', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('POST /api/imaging-orders', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/imaging-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: '1' }),
      })
      
      expect(response.status).toBe(401)
    })

    it('should return 400 when studyType is missing', async () => {
      const invalidOrder = {
        patientId: '1',
        doctorId: '1',
        bodyPart: 'Chest',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Study type is required' }),
      } as Response)

      const response = await fetch('/api/imaging-orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(invalidOrder),
      })
      
      expect(response.status).toBe(400)
    })

    it('should return 400 when bodyPart is missing', async () => {
      const invalidOrder = {
        patientId: '1',
        doctorId: '1',
        studyType: 'RX',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Body part is required' }),
      } as Response)

      const response = await fetch('/api/imaging-orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(invalidOrder),
      })
      
      expect(response.status).toBe(400)
    })
  })
})

describe('Services API Error Handling', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/services/[id]', () => {
    it('should return 404 when service not found', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Service not found' }),
      } as Response)

      const response = await fetch('/api/services/999999', {
        headers: { 'Authorization': 'Bearer mock-token' }
      })
      
      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/services', () => {
    it('should return 400 for negative price', async () => {
      const invalidService = {
        name: 'Consultation',
        basePrice: -100,
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Price must be positive' }),
      } as Response)

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(invalidService),
      })
      
      expect(response.status).toBe(400)
    })

    it('should return 400 for empty name', async () => {
      const invalidService = {
        name: '',
        basePrice: 100,
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Name is required' }),
      } as Response)

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify(invalidService),
      })
      
      expect(response.status).toBe(400)
    })
  })
})

describe('Settings API Error Handling', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('PATCH /api/settings/clinic', () => {
    it('should return 401 when no session', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/settings/clinic', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Clinic' }),
      })
      
      expect(response.status).toBe(401)
    })

    it('should return 403 when user is not admin', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Only admins can update clinic settings' }),
      } as Response)

      const response = await fetch('/api/settings/clinic', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({ name: 'New Clinic' }),
      })
      
      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/settings/users', () => {
    it('should return 400 for duplicate email', async () => {
      const invalidUser = {
        email: 'existing@example.com',
        name: 'Test User',
        role: 'DOCTOR',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Email already exists' }),
      } as Response)

      const response = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify(invalidUser),
      })
      
      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid role', async () => {
      const invalidUser = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'INVALID_ROLE',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid role' }),
      } as Response)

      const response = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify(invalidUser),
      })
      
      expect(response.status).toBe(400)
    })
  })
})
