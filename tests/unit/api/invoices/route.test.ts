import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/invoices/route'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Map())
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn()
    }
  }
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn()
    },
    patient: {
      findFirst: vi.fn()
    }
  }
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const mockSession = {
  user: { id: 'user-1', role: 'ADMIN', clinicId: BigInt(1) }
}

const mockInvoice = {
  id: BigInt(1),
  clinicId: BigInt(1),
  patientId: BigInt(1),
  clinicInvoiceNumber: 'INV-000001',
  issuedById: 'user-1',
  issueDate: new Date('2024-01-15'),
  dueDate: null,
  subtotal: 100,
  tax: 0,
  discount: 0,
  total: 100,
  status: 'PENDING',
  notes: null,
  patient: {
    id: BigInt(1),
    firstName: 'John',
    lastName: 'Doe',
    middleName: null,
    curp: 'ABCD123456EFGH78'
  },
  issuedBy: {
    id: 'user-1',
    name: 'Admin User'
  },
  items: [],
  payments: []
}

describe('Invoices API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/invoices', () => {
    it('should return invoices for authenticated user', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([mockInvoice] as any)
      vi.mocked(prisma.invoice.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/invoices')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.pagination.total).toBe(1)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/invoices')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should filter by patientId', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([mockInvoice] as any)
      vi.mocked(prisma.invoice.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/invoices?patientId=1')
      await GET(request)

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ patientId: BigInt(1) })
        })
      )
    })

    it('should filter by status', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([mockInvoice] as any)
      vi.mocked(prisma.invoice.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/invoices?status=PENDING')
      await GET(request)

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' })
        })
      )
    })

    it('should filter by date range', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([mockInvoice] as any)
      vi.mocked(prisma.invoice.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/invoices?startDate=2024-01-01&endDate=2024-01-31')
      await GET(request)

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            issueDate: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31')
            }
          })
        })
      )
    })

    it('should include summary in response', async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([mockInvoice] as any)
      vi.mocked(prisma.invoice.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/invoices')
      const response = await GET(request)
      const data = await response.json()

      expect(data.summary).toBeDefined()
      expect(data.summary.totalInvoices).toBe(1)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.invoice.findMany).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/invoices')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/invoices', () => {
    it('should create invoice successfully', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue({ id: BigInt(1) } as any)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.invoice.create).mockResolvedValue(mockInvoice as any)

      const request = new NextRequest('http://localhost/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          items: [{
            description: 'Consultation',
            quantity: 1,
            unitPrice: 100,
            discount: 0
          }]
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.clinicInvoiceNumber).toBe('INV-000001')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/invoices', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost/api/invoices', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '999',
          items: [{
            description: 'Consultation',
            quantity: 1,
            unitPrice: 100,
            discount: 0
          }]
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should generate sequential invoice number', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue({ id: BigInt(1) } as any)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        clinicInvoiceNumber: 'INV-000005'
      } as any)
      vi.mocked(prisma.invoice.create).mockResolvedValue(mockInvoice as any)

      const request = new NextRequest('http://localhost/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          items: [{
            description: 'Consultation',
            quantity: 1,
            unitPrice: 100,
            discount: 0
          }]
        })
      })

      await POST(request)

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clinicInvoiceNumber: 'INV-000006'
          })
        })
      )
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.patient.findFirst).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          items: [{
            description: 'Consultation',
            quantity: 1,
            unitPrice: 100,
            discount: 0
          }]
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
