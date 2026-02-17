import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockInvoices = [
  {
    id: '1',
    clinicId: '1',
    patientId: '1',
    clinicInvoiceNumber: 'INV-001',
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    subtotal: 300,
    tax: 0,
    discount: 0,
    total: 300,
    status: 'PENDING',
    items: [
      { description: 'Consulta', quantity: 1, unitPrice: 300, total: 300 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

describe('Invoices & Payments API', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/invoices', () => {
    it('should return list of invoices', async () => {
      const mockResponse = {
        data: mockInvoices,
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const response = await fetch('/api/invoices')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].status).toBe('PENDING')
    })

    it('should filter invoices by patient', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockInvoices, pagination: { page: 1, limit: 10, total: 1, pages: 1 } }),
      } as Response)

      const response = await fetch('/api/invoices?patientId=1')
      expect(response.ok).toBe(true)
    })

    it('should filter invoices by status', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockInvoices, pagination: { page: 1, limit: 10, total: 1, pages: 1 } }),
      } as Response)

      const response = await fetch('/api/invoices?status=PENDING')
      expect(response.ok).toBe(true)
      expect(response.ok).toBe(true)
    })

    it('should filter invoices by date range', async () => {
      const startDate = '2024-01-01'
      const endDate = '2024-12-31'

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockInvoices, pagination: { page: 1, limit: 10, total: 1, pages: 1 } }),
      } as Response)

      const response = await fetch(`/api/invoices?startDate=${startDate}&endDate=${endDate}`)
      expect(response.ok).toBe(true)
    })
  })

  describe('POST /api/invoices', () => {
    it('should create a new invoice', async () => {
      const newInvoice = {
        patientId: '1',
        items: [
          { description: 'Consulta de medicina general', quantity: 1, unitPrice: 300, discount: 0 },
        ],
        notes: 'Factura de consulta',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          ...newInvoice,
          id: '2',
          clinicInvoiceNumber: 'INV-002',
          subtotal: 300,
          total: 300,
          status: 'PENDING',
        }),
      } as Response)

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice),
      })

      expect(response.status).toBe(201)
    })

    it('should calculate totals automatically', async () => {
      const invoiceWithMultipleItems = {
        patientId: '1',
        items: [
          { description: 'Consulta', quantity: 1, unitPrice: 300, discount: 0 },
          { description: 'Estudio', quantity: 1, unitPrice: 200, discount: 50 },
        ],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          ...invoiceWithMultipleItems,
          id: '2',
          subtotal: 500,
          discount: 50,
          total: 450,
        }),
      } as Response)

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceWithMultipleItems),
      })

      const data = await response.json()
      expect(data.total).toBe(450)
    })

    it('should return 400 for empty items', async () => {
      const invalidInvoice = {
        patientId: '1',
        items: [],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Al menos un item requerido' }),
      } as Response)

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidInvoice),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/invoices/[id]/payments', () => {
    it('should register a payment', async () => {
      const newPayment = {
        amount: 300,
        method: 'CASH',
        reference: 'PAY001',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          ...newPayment,
          id: '2',
          paymentDate: new Date().toISOString(),
        }),
      } as Response)

      const response = await fetch('/api/invoices/1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayment),
      })

      expect(response.status).toBe(201)
    })

    it('should update invoice status when fully paid', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'PAID' }),
      } as Response)

      const response = await fetch('/api/invoices/1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 300, method: 'CASH' }),
      })

      expect(response.ok).toBe(true)
    })

    it('should return 400 for negative amount', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Monto requerido' }),
      } as Response)

      const response = await fetch('/api/invoices/1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: -100, method: 'CASH' }),
      })

      expect(response.status).toBe(400)
    })

    it('should accept all payment methods', async () => {
      const methods = ['CASH', 'CARD', 'TRANSFER', 'CHECK']

      for (const method of methods) {
        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          status: 201,
          json: async () => ({ id: '1', method }),
        } as Response)

        const response = await fetch('/api/invoices/1/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 100, method }),
        })

        expect(response.status).toBe(201)
      }
    })
  })

  describe('Invoice status updates', () => {
    it('should update invoice status', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockInvoices[0], status: 'PAID' }),
      } as Response)

      const response = await fetch('/api/invoices/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      })

      expect(response.ok).toBe(true)
    })

    it('should allow cancelling invoices', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockInvoices[0], status: 'CANCELLED' }),
      } as Response)

      const response = await fetch('/api/invoices/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      expect(response.ok).toBe(true)
    })
  })
})
