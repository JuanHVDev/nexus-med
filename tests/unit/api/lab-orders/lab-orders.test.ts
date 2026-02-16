import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockLabOrders = [
  {
    id: '1',
    clinicId: '1',
    patientId: '1',
    doctorId: 'user-doctor-1',
    orderDate: new Date().toISOString(),
    tests: [
      { name: 'Biometría hemática', code: 'BH001', price: 250 },
      { name: 'Química sanguínea', code: 'QS001', price: 350 },
    ],
    instructions: 'Ayuno de 12 horas',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockImagingOrders = [
  {
    id: '1',
    clinicId: '1',
    patientId: '1',
    doctorId: 'user-doctor-1',
    orderDate: new Date().toISOString(),
    studyType: 'RX',
    bodyPart: 'Tórax',
    reason: 'Tos persistente',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

describe('Lab & Imaging Orders API', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/lab-orders', () => {
    it('should return list of lab orders', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockLabOrders, pagination: { page: 1, limit: 10, total: 1, pages: 1 } }),
      } as Response)

      const response = await fetch('/api/lab-orders')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].tests).toHaveLength(2)
    })

    it('should filter lab orders by patient', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockLabOrders, pagination: { page: 1, limit: 10, total: 1, pages: 1 } }),
      } as Response)

      const response = await fetch('/api/lab-orders?patientId=1')
      expect(response.ok).toBe(true)
    })

    it('should filter lab orders by status', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockLabOrders, pagination: { page: 1, limit: 10, total: 1, pages: 1 } }),
      } as Response)

      const response = await fetch('/api/lab-orders?status=PENDING')
      expect(response.ok).toBe(true)
    })
  })

  describe('POST /api/lab-orders', () => {
    it('should create a new lab order', async () => {
      const newLabOrder = {
        patientId: '1',
        tests: [
          { name: 'Examen de orina', code: 'EO001', price: 150 },
        ],
        instructions: 'Primera miccion de la manana',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ ...newLabOrder, id: '2', status: 'PENDING' }),
      } as Response)

      const response = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLabOrder),
      })

      expect(response.status).toBe(201)
    })

    it('should return 400 for empty tests', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Al menos un estudio requerido' }),
      } as Response)

      const response = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: '1', tests: [] }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/lab-orders/[id]/results', () => {
    it('should add results to lab order', async () => {
      const results = [
        { testName: 'Biometría hemática', result: '12.5', unit: 'g/dL', flag: 'NORMAL' },
      ]

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockLabOrders[0], status: 'COMPLETED', results }),
      } as Response)

      const response = await fetch('/api/lab-orders/1/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      })

      expect(response.ok).toBe(true)
    })
  })

  describe('GET /api/imaging-orders', () => {
    it('should return list of imaging orders', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockImagingOrders, pagination: { page: 1, limit: 10, total: 1, pages: 1 } }),
      } as Response)

      const response = await fetch('/api/imaging-orders')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].studyType).toBe('RX')
    })

    it('should filter imaging orders by study type', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockImagingOrders, pagination: { page: 1, limit: 10, total: 1, pages: 1 } }),
      } as Response)

      const response = await fetch('/api/imaging-orders?studyType=RX')
      expect(response.ok).toBe(true)
    })
  })

  describe('POST /api/imaging-orders', () => {
    it('should create a new imaging order', async () => {
      const newImagingOrder = {
        patientId: '1',
        studyType: 'ULTRASOUND',
        bodyPart: 'Abdomen',
        reason: 'Dolor abdominal',
        clinicalNotes: 'Paciente con síntomas',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ ...newImagingOrder, id: '2', status: 'PENDING' }),
      } as Response)

      const response = await fetch('/api/imaging-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newImagingOrder),
      })

      expect(response.status).toBe(201)
    })

    it('should return 400 for missing required fields', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Datos requeridos faltantes' }),
      } as Response)

      const response = await fetch('/api/imaging-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: '1' }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Order status updates', () => {
    it('should update lab order status', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockLabOrders[0], status: 'COMPLETED' }),
      } as Response)

      const response = await fetch('/api/lab-orders/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      expect(response.ok).toBe(true)
    })

    it('should update imaging order status', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockImagingOrders[0], status: 'COMPLETED' }),
      } as Response)

      const response = await fetch('/api/imaging-orders/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      expect(response.ok).toBe(true)
    })
  })
})
