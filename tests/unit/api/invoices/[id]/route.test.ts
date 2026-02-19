/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT, DELETE } from '@/app/api/invoices/[id]/route'
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
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
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
    name: 'Admin User',
    email: 'admin@test.com'
  },
  items: [],
  payments: []
}

describe('Invoices [id] API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/invoices/[id]', () => {
    it('should return invoice by id', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(mockInvoice as any)

      const response = await GET(new NextRequest('http://localhost/api/invoices/1'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/invoices/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid invoice id', async () => {
      const response = await GET(new NextRequest('http://localhost/api/invoices/invalid'), {
        params: Promise.resolve({ id: 'invalid' })
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 when invoice not found', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null)

      const response = await GET(new NextRequest('http://localhost/api/invoices/999'), {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should include totalPaid and balance in response', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(mockInvoice as any)

      const response = await GET(new NextRequest('http://localhost/api/invoices/1'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(data.totalPaid).toBeDefined()
      expect(data.balance).toBeDefined()
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.invoice.findFirst).mockRejectedValue(new Error('DB error'))

      const response = await GET(new NextRequest('http://localhost/api/invoices/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(500)
    })
  })

  describe('PUT /api/invoices/[id]', () => {
    it('should update invoice successfully', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(mockInvoice as any)
      vi.mocked(prisma.invoice.update).mockResolvedValue({
        ...mockInvoice,
        status: 'PAID'
      } as any)

      const request = new NextRequest('http://localhost/api/invoices/1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'PAID' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('PAID')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/invoices/1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'PAID' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid invoice id', async () => {
      const request = new NextRequest('http://localhost/api/invoices/invalid', {
        method: 'PUT',
        body: JSON.stringify({ status: 'PAID' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'invalid' })
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost/api/invoices/1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'INVALID' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 when invoice not found', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/invoices/999', {
        method: 'PUT',
        body: JSON.stringify({ status: 'PAID' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.invoice.findFirst).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/invoices/1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'PAID' })
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(500)
    })
  })

  describe('DELETE /api/invoices/[id]', () => {
    it('should delete invoice successfully', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(mockInvoice as any)
      vi.mocked(prisma.invoice.delete).mockResolvedValue(mockInvoice as any)

      const response = await DELETE(new NextRequest('http://localhost/api/invoices/1'), {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Invoice deleted')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await DELETE(new NextRequest('http://localhost/api/invoices/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid invoice id', async () => {
      const response = await DELETE(new NextRequest('http://localhost/api/invoices/invalid'), {
        params: Promise.resolve({ id: 'invalid' })
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 when invoice not found', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null)

      const response = await DELETE(new NextRequest('http://localhost/api/invoices/999'), {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should return 400 when invoice has payments', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        payments: [{ id: BigInt(1), amount: 50 }]
      } as any)

      const response = await DELETE(new NextRequest('http://localhost/api/invoices/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 when invoice is paid', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        status: 'PAID',
        payments: []
      } as any)

      const response = await DELETE(new NextRequest('http://localhost/api/invoices/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(400)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.invoice.findFirst).mockRejectedValue(new Error('DB error'))

      const response = await DELETE(new NextRequest('http://localhost/api/invoices/1'), {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(500)
    })
  })
})
