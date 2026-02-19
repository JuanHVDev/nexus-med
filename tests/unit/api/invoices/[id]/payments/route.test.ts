/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/invoices/[id]/payments/route'
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
      update: vi.fn()
    },
    payment: {
      create: vi.fn()
    },
    $transaction: vi.fn()
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
  total: 100,
  status: 'PENDING',
  payments: []
}

const mockPayment = {
  id: BigInt(1),
  invoiceId: BigInt(1),
  amount: 50,
  method: 'CASH',
  reference: null,
  notes: null,
  paymentDate: new Date()
}

describe('Invoice Payments API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('POST /api/invoices/[id]/payments', () => {
    it('should create payment successfully', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(mockInvoice as any)
      vi.mocked(prisma.payment.create).mockResolvedValue(mockPayment as any)
      vi.mocked(prisma.invoice.update).mockResolvedValue({
        ...mockInvoice,
        status: 'PARTIAL'
      } as any)
      vi.mocked(prisma.$transaction).mockResolvedValue([mockPayment, { ...mockInvoice, status: 'PARTIAL' }] as any)

      const request = new NextRequest('http://localhost/api/invoices/1/payments', {
        method: 'POST',
        body: JSON.stringify({
          amount: 50,
          method: 'CASH'
        })
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/invoices/1/payments', {
        method: 'POST',
        body: JSON.stringify({ amount: 50, method: 'CASH' })
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost/api/invoices/1/payments', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(400)
    })

    it('should return 404 when invoice not found', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/invoices/999/payments', {
        method: 'POST',
        body: JSON.stringify({ amount: 50, method: 'CASH' })
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '999' })
      })

      expect(response.status).toBe(404)
    })

    it('should return 400 when invoice is cancelled', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue({
        ...mockInvoice,
        status: 'CANCELLED'
      } as any)

      const request = new NextRequest('http://localhost/api/invoices/1/payments', {
        method: 'POST',
        body: JSON.stringify({ amount: 50, method: 'CASH' })
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(400)
    })

    it('should update status to PAID when fully paid', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(mockInvoice as any)
      vi.mocked(prisma.payment.create).mockResolvedValue({
        ...mockPayment,
        amount: 100
      } as any)
      vi.mocked(prisma.invoice.update).mockResolvedValue({
        ...mockInvoice,
        status: 'PAID'
      } as any)
      vi.mocked(prisma.$transaction).mockResolvedValue([{
        ...mockPayment,
        amount: 100
      }, { ...mockInvoice, status: 'PAID' }] as any)

      const request = new NextRequest('http://localhost/api/invoices/1/payments', {
        method: 'POST',
        body: JSON.stringify({ amount: 100, method: 'CASH' })
      })

      await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should update status to PARTIAL when partially paid', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(mockInvoice as any)
      vi.mocked(prisma.payment.create).mockResolvedValue(mockPayment as any)
      vi.mocked(prisma.invoice.update).mockResolvedValue({
        ...mockInvoice,
        status: 'PARTIAL'
      } as any)
      vi.mocked(prisma.$transaction).mockResolvedValue([mockPayment, { ...mockInvoice, status: 'PARTIAL' }] as any)

      const request = new NextRequest('http://localhost/api/invoices/1/payments', {
        method: 'POST',
        body: JSON.stringify({ amount: 50, method: 'CASH' })
      })

      await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.invoice.findFirst).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/invoices/1/payments', {
        method: 'POST',
        body: JSON.stringify({ amount: 50, method: 'CASH' })
      })

      const response = await POST(request, {
        params: Promise.resolve({ id: '1' })
      })

      expect(response.status).toBe(500)
    })
  })
})
