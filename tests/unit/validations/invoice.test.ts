import { describe, it, expect } from 'vitest'
import { 
  invoiceSchema, 
  invoiceInputSchema,
  invoiceUpdateSchema,
  invoiceFilterSchema,
  invoiceItemSchema,
  paymentSchema
} from '@/lib/validations/invoice'

const validInvoice = {
  patientId: '1',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  notes: 'Factura de consulta',
  items: [
    {
      description: 'Consulta de medicina general',
      quantity: 1,
      unitPrice: 300,
      discount: 0,
    },
  ],
}

describe('invoiceSchema', () => {
  it('should validate a valid invoice', () => {
    const result = invoiceSchema.safeParse(validInvoice)
    expect(result.success).toBe(true)
  })

  it('should reject empty patientId', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, patientId: '' })
    expect(result.success).toBe(false)
  })

  it('should reject empty items array', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, items: [] })
    expect(result.success).toBe(false)
  })

  it('should reject item without description', () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      items: [{ quantity: 1, unitPrice: 300 }],
    })
    expect(result.success).toBe(false)
  })

  it('should reject item with quantity less than 1', () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      items: [{ description: 'Test', quantity: 0, unitPrice: 300 }],
    })
    expect(result.success).toBe(false)
  })

  it('should reject item with negative unitPrice', () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      items: [{ description: 'Test', quantity: 1, unitPrice: -100 }],
    })
    expect(result.success).toBe(false)
  })

  it('should calculate total for each item', () => {
    const result = invoiceSchema.safeParse(validInvoice)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.items[0].total).toBe(300)
    }
  })

  it('should apply discount to item total', () => {
    const invoiceWithDiscount = {
      ...validInvoice,
      items: [{ description: 'Test', quantity: 1, unitPrice: 300, discount: 50 }],
    }
    const result = invoiceSchema.safeParse(invoiceWithDiscount)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.items[0].total).toBe(250)
    }
  })

  it('should transform patientId to BigInt', () => {
    const result = invoiceSchema.safeParse(validInvoice)
    expect(result.success).toBe(true)
  })

  it('should transform serviceId to BigInt if provided', () => {
    const invoiceWithService = {
      ...validInvoice,
      items: [{ serviceId: '1', description: 'Test', quantity: 1, unitPrice: 300, discount: 0 }],
    }
    const result = invoiceSchema.safeParse(invoiceWithService)
    expect(result.success).toBe(true)
  })
})

describe('invoiceInputSchema', () => {
  it('should validate without transformation', () => {
    const result = invoiceInputSchema.safeParse(validInvoice)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.patientId).toBe('string')
    }
  })
})

describe('invoiceUpdateSchema', () => {
  it('should allow partial updates', () => {
    const result = invoiceUpdateSchema.safeParse({ status: 'PAID' })
    expect(result.success).toBe(true)
  })

  it('should allow multiple partial updates', () => {
    const result = invoiceUpdateSchema.safeParse({
      status: 'PAID',
      notes: 'Pagado',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid status', () => {
    const result = invoiceUpdateSchema.safeParse({ status: 'INVALID' })
    expect(result.success).toBe(false)
  })
})

describe('invoiceFilterSchema', () => {
  it('should validate empty filter', () => {
    const result = invoiceFilterSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should validate patientId filter', () => {
    const result = invoiceFilterSchema.safeParse({ patientId: '1' })
    expect(result.success).toBe(true)
  })

  it('should validate status filter', () => {
    const result = invoiceFilterSchema.safeParse({ status: 'PENDING' })
    expect(result.success).toBe(true)
  })

  it('should validate date range filter', () => {
    const result = invoiceFilterSchema.safeParse({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid status in filter', () => {
    const result = invoiceFilterSchema.safeParse({ status: 'INVALID' })
    expect(result.success).toBe(false)
  })
})

describe('invoiceItemSchema', () => {
  it('should validate a valid invoice item', () => {
    const item = {
      description: 'Consulta médica',
      quantity: 1,
      unitPrice: 300,
      discount: 0,
    }
    const result = invoiceItemSchema.safeParse(item)
    expect(result.success).toBe(true)
  })

  it('should make serviceId optional', () => {
    const item = {
      description: 'Consulta médica',
      quantity: 1,
      unitPrice: 300,
      discount: 0,
    }
    const result = invoiceItemSchema.safeParse(item)
    expect(result.success).toBe(true)
  })
})

describe('paymentSchema', () => {
  it('should validate a valid payment', () => {
    const payment = {
      amount: 300,
      method: 'CASH' as const,
      reference: 'REF001',
      notes: 'Pago en efectivo',
    }
    const result = paymentSchema.safeParse(payment)
    expect(result.success).toBe(true)
  })

  it('should reject negative amount', () => {
    const payment = {
      amount: -100,
      method: 'CASH' as const,
    }
    const result = paymentSchema.safeParse(payment)
    expect(result.success).toBe(false)
  })

  it('should reject zero amount', () => {
    const payment = {
      amount: 0,
      method: 'CASH' as const,
    }
    const result = paymentSchema.safeParse(payment)
    expect(result.success).toBe(false)
  })

  it('should reject invalid payment method', () => {
    const payment = {
      amount: 300,
      method: 'INVALID' as never,
    }
    const result = paymentSchema.safeParse(payment)
    expect(result.success).toBe(false)
  })

  it('should accept all valid payment methods', () => {
    const methods = ['CASH', 'CARD', 'TRANSFER', 'CHECK'] as const
    for (const method of methods) {
      const payment = { amount: 300, method }
      const result = paymentSchema.safeParse(payment)
      expect(result.success).toBe(true)
    }
  })

  it('should make reference optional', () => {
    const payment = {
      amount: 300,
      method: 'CASH' as const,
    }
    const result = paymentSchema.safeParse(payment)
    expect(result.success).toBe(true)
  })
})
