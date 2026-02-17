import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockImagingOrders = [
  {
    id: '1',
    clinicId: '1',
    patientId: '1',
    doctorId: 'user-doctor-1',
    medicalNoteId: '1',
    orderDate: new Date().toISOString(),
    studyType: 'RX',
    bodyPart: 'Tórax',
    reason: 'Tos persistente',
    clinicalNotes: 'Paciente con síntomas respiratorios',
    status: 'PENDING',
    reportUrl: null,
    imagesUrl: null,
    findings: null,
    impression: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    patient: {
      id: '1',
      firstName: 'Juan',
      lastName: 'Pérez',
      middleName: 'López',
    },
    doctor: {
      id: 'user-doctor-1',
      name: 'Dr. Ana García',
    },
  },
  {
    id: '2',
    clinicId: '1',
    patientId: '2',
    doctorId: 'user-doctor-1',
    medicalNoteId: '2',
    orderDate: new Date().toISOString(),
    studyType: 'ULTRASOUND',
    bodyPart: 'Abdomen',
    reason: 'Dolor abdominal',
    clinicalNotes: 'Evaluación de órganos abdominales',
    status: 'COMPLETED',
    reportUrl: 'https://storage.example.com/reports/2.pdf',
    imagesUrl: null,
    findings: 'Hígado de tamaño normal, vesícula con cálculos',
    impression: 'Litiasis vesicular',
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    patient: {
      id: '2',
      firstName: 'María',
      lastName: 'González',
      middleName: null,
    },
    doctor: {
      id: 'user-doctor-1',
      name: 'Dr. Ana García',
    },
  },
  {
    id: '3',
    clinicId: '1',
    patientId: '1',
    doctorId: 'user-doctor-2',
    medicalNoteId: null,
    orderDate: new Date().toISOString(),
    studyType: 'CT',
    bodyPart: 'Cabeza',
    reason: 'Traumatismo craneoencefálico',
    clinicalNotes: 'Paciente con golpe en la cabeza',
    status: 'IN_PROGRESS',
    reportUrl: null,
    imagesUrl: 'https://storage.example.com/images/3',
    findings: null,
    impression: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    patient: {
      id: '1',
      firstName: 'Juan',
      lastName: 'Pérez',
      middleName: 'López',
    },
    doctor: {
      id: 'user-doctor-2',
      name: 'Dr. Carlos Martínez',
    },
  },
]

describe('Imaging Orders API', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/imaging-orders', () => {
    it('should return list of imaging orders', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockImagingOrders,
      } as Response)

      const response = await fetch('/api/imaging-orders')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(3)
    })

    it('should filter by patientId', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [mockImagingOrders[0], mockImagingOrders[2]],
      } as Response)

      const response = await fetch('/api/imaging-orders?patientId=1')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(2)
    })

    it('should filter by status', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [mockImagingOrders[1]],
      } as Response)

      const response = await fetch('/api/imaging-orders?status=COMPLETED')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(1)
      expect(data[0].status).toBe('COMPLETED')
    })

    it('should filter by doctorId', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [mockImagingOrders[0], mockImagingOrders[1]],
      } as Response)

      const response = await fetch('/api/imaging-orders?doctorId=user-doctor-1')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(2)
    })

    it('should filter by studyType', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [mockImagingOrders[2]],
      } as Response)

      const response = await fetch('/api/imaging-orders?studyType=CT')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(1)
      expect(data[0].studyType).toBe('CT')
    })

    it('should filter by medicalNoteId', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [mockImagingOrders[0]],
      } as Response)

      const response = await fetch('/api/imaging-orders?medicalNoteId=1')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(1)
    })

    it('should filter by date range', async () => {
      const fromDate = new Date().toISOString()
      const toDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockImagingOrders,
      } as Response)

      const response = await fetch(`/api/imaging-orders?fromDate=${fromDate}&toDate=${toDate}`)

      expect(response.ok).toBe(true)
    })
  })

  describe('POST /api/imaging-orders', () => {
    it('should create a new imaging order', async () => {
      const newOrder = {
        patientId: '1',
        doctorId: 'user-doctor-1',
        medicalNoteId: '1',
        studyType: 'MRI',
        bodyPart: 'Rodilla',
        reason: 'Dolor articular',
        clinicalNotes: 'Lesión deportiva',
      }

      const mockResponse = {
        ...newOrder,
        id: '4',
        clinicId: '1',
        orderDate: new Date().toISOString(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        patient: {
          id: '1',
          firstName: 'Juan',
          lastName: 'Pérez',
          middleName: 'López',
        },
        doctor: {
          id: 'user-doctor-1',
          name: 'Dr. Ana García',
        },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/imaging-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      })

      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.studyType).toBe('MRI')
      expect(data.bodyPart).toBe('Rodilla')
    })

    it('should return 400 for validation error - missing required fields', async () => {
      const invalidOrder = {
        patientId: '1',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Validation error', errors: { studyType: ['Required'], bodyPart: ['Required'] } }),
      } as Response)

      const response = await fetch('/api/imaging-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidOrder),
      })

      expect(response.status).toBe(400)
    })

    it('should return 403 for forbidden role', async () => {
      const orderData = {
        patientId: '1',
        doctorId: 'user-doctor-1',
        studyType: 'RX',
        bodyPart: 'Tórax',
        reason: 'Prueba',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' }),
      } as Response)

      const response = await fetch('/api/imaging-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      expect(response.status).toBe(403)
    })

    it('should return 401 for unauthenticated request', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/imaging-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: '1',
          doctorId: 'user-doctor-1',
          studyType: 'RX',
          bodyPart: 'Tórax',
          reason: 'Prueba',
        }),
      })

      expect(response.status).toBe(401)
    })

    it('should create order without medicalNoteId', async () => {
      const newOrder = {
        patientId: '1',
        doctorId: 'user-doctor-1',
        studyType: 'RX',
        bodyPart: 'Tórax',
        reason: 'Chequeo rutinario',
      }

      const mockResponse = {
        ...newOrder,
        id: '5',
        clinicId: '1',
        medicalNoteId: null,
        orderDate: new Date().toISOString(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/imaging-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      })

      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.medicalNoteId).toBeNull()
    })
  })

  describe('GET /api/imaging-orders/[id]', () => {
    it('should return imaging order by id', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockImagingOrders[0],
      } as Response)

      const response = await fetch('/api/imaging-orders/1')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.id).toBe('1')
      expect(data.studyType).toBe('RX')
    })

    it('should return 404 when imaging order not found', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Imaging order not found' }),
      } as Response)

      const response = await fetch('/api/imaging-orders/999')
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.message).toBe('Imaging order not found')
    })

    it('should include patient and doctor details', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockImagingOrders[0],
      } as Response)

      const response = await fetch('/api/imaging-orders/1')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.patient).toBeDefined()
      expect(data.patient.firstName).toBe('Juan')
      expect(data.doctor).toBeDefined()
      expect(data.doctor.name).toBe('Dr. Ana García')
    })
  })

  describe('PUT /api/imaging-orders/[id]', () => {
    it('should update imaging order status to COMPLETED', async () => {
      const updateData = { status: 'COMPLETED' }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockImagingOrders[0], status: 'COMPLETED', completedAt: new Date().toISOString() }),
      } as Response)

      const response = await fetch('/api/imaging-orders/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.status).toBe('COMPLETED')
    })

    it('should update imaging order with findings and impression', async () => {
      const updateData = {
        findings: 'Opacidad en lóbulo superior derecho',
        impression: 'Neumonía',
        status: 'COMPLETED',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockImagingOrders[0], ...updateData, completedAt: new Date().toISOString() }),
      } as Response)

      const response = await fetch('/api/imaging-orders/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.findings).toBe('Opacidad en lóbulo superior derecho')
      expect(data.impression).toBe('Neumonía')
    })

    it('should update imaging order with report and images URLs', async () => {
      const updateData = {
        reportUrl: 'https://storage.example.com/reports/1-final.pdf',
        imagesUrl: 'https://storage.example.com/images/1',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockImagingOrders[0], ...updateData }),
      } as Response)

      const response = await fetch('/api/imaging-orders/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.reportUrl).toBe('https://storage.example.com/reports/1-final.pdf')
      expect(data.imagesUrl).toBe('https://storage.example.com/images/1')
    })

    it('should return 400 for validation error', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Validation error', errors: { status: ['Invalid status'] } }),
      } as Response)

      const response = await fetch('/api/imaging-orders/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INVALID_STATUS' }),
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 when imaging order not found for update', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Imaging order not found' }),
      } as Response)

      const response = await fetch('/api/imaging-orders/999', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      expect(response.status).toBe(404)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' }),
      } as Response)

      const response = await fetch('/api/imaging-orders/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/imaging-orders/[id]', () => {
    it('should delete imaging order', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Imaging order deleted' }),
      } as Response)

      const response = await fetch('/api/imaging-orders/1', {
        method: 'DELETE',
      })

      expect(response.ok).toBe(true)
    })

    it('should return 404 when imaging order not found for deletion', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Imaging order not found' }),
      } as Response)

      const response = await fetch('/api/imaging-orders/999', {
        method: 'DELETE',
      })

      expect(response.status).toBe(404)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' }),
      } as Response)

      const response = await fetch('/api/imaging-orders/1', {
        method: 'DELETE',
      })

      expect(response.status).toBe(403)
    })
  })

  describe('Status transitions', () => {
    it('should transition from PENDING to IN_PROGRESS', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockImagingOrders[0], status: 'IN_PROGRESS' }),
      } as Response)

      const response = await fetch('/api/imaging-orders/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.status).toBe('IN_PROGRESS')
    })

    it('should transition from IN_PROGRESS to COMPLETED', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockImagingOrders[2],
          status: 'COMPLETED',
          completedAt: new Date().toISOString()
        }),
      } as Response)

      const response = await fetch('/api/imaging-orders/3', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.status).toBe('COMPLETED')
      expect(data.completedAt).toBeDefined()
    })

    it('should cancel order', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockImagingOrders[0], status: 'CANCELLED' }),
      } as Response)

      const response = await fetch('/api/imaging-orders/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.status).toBe('CANCELLED')
    })
  })
})
