import { describe, it, expect } from 'vitest'
import { 
  calculateItemTotal, 
  calculateInvoiceTotals, 
  calculateTotalPaid,
  calculateBalance,
  determinePaymentStatus,
  canDeleteInvoice,
  canAddPayment,
  generateInvoiceNumber
} from '@/lib/domain/invoices/invoice-calculator'

describe('invoice-calculator', () => {
  describe('calculateItemTotal', () => {
    it('should calculate total correctly', () => {
      const item = {
        description: 'Consulta',
        quantity: 2,
        unitPrice: 500,
        discount: 100,
      }

      expect(calculateItemTotal(item)).toBe(900)
    })

    it('should handle zero discount', () => {
      const item = {
        description: 'Consulta',
        quantity: 1,
        unitPrice: 500,
        discount: 0,
      }

      expect(calculateItemTotal(item)).toBe(500)
    })

    it('should handle zero quantity', () => {
      const item = {
        description: 'Consulta',
        quantity: 0,
        unitPrice: 500,
        discount: 0,
      }

      expect(calculateItemTotal(item)).toBe(0)
    })
  })

  describe('calculateInvoiceTotals', () => {
    it('should calculate totals for multiple items', () => {
      const items = [
        { description: 'Consulta', quantity: 1, unitPrice: 500, discount: 0, total: 500 },
        { description: 'Radiografía', quantity: 2, unitPrice: 300, discount: 50, total: 550 },
      ]

      const result = calculateInvoiceTotals(items)

      expect(result.subtotal).toBe(1100)
      expect(result.totalDiscount).toBe(50)
      expect(result.tax).toBe(0)
      expect(result.total).toBe(1050)
    })

    it('should handle empty items array', () => {
      const result = calculateInvoiceTotals([])

      expect(result.subtotal).toBe(0)
      expect(result.totalDiscount).toBe(0)
      expect(result.tax).toBe(0)
      expect(result.total).toBe(0)
    })

    it('should handle single item', () => {
      const items = [
        { description: 'Consulta', quantity: 1, unitPrice: 1000, discount: 100, total: 900 },
      ]

      const result = calculateInvoiceTotals(items)

      expect(result.subtotal).toBe(1000)
      expect(result.totalDiscount).toBe(100)
      expect(result.total).toBe(900)
    })
  })

  describe('calculateTotalPaid', () => {
    it('should sum all payment amounts', () => {
      const payments = [
        { amount: 500 },
        { amount: 300 },
        { amount: 200 },
      ]

      expect(calculateTotalPaid(payments)).toBe(1000)
    })

    it('should return 0 for empty payments', () => {
      expect(calculateTotalPaid([])).toBe(0)
    })
  })

  describe('calculateBalance', () => {
    it('should calculate positive balance', () => {
      expect(calculateBalance(1000, 300)).toBe(700)
    })

    it('should return 0 when fully paid', () => {
      expect(calculateBalance(1000, 1000)).toBe(0)
    })

    it('should return negative when overpaid', () => {
      expect(calculateBalance(1000, 1200)).toBe(-200)
    })
  })

  describe('determinePaymentStatus', () => {
    it('should return PAID when totalPaid >= total', () => {
      expect(determinePaymentStatus(1000, 1000)).toBe('PAID')
      expect(determinePaymentStatus(1000, 1200)).toBe('PAID')
    })

    it('should return PARTIAL when totalPaid > 0 but < total', () => {
      expect(determinePaymentStatus(1000, 500)).toBe('PARTIAL')
      expect(determinePaymentStatus(1000, 1)).toBe('PARTIAL')
    })

    it('should return PENDING when totalPaid is 0', () => {
      expect(determinePaymentStatus(1000, 0)).toBe('PENDING')
    })
  })

  describe('canDeleteInvoice', () => {
    it('should allow delete for PENDING invoice without payments', () => {
      const result = canDeleteInvoice('PENDING', false)
      expect(result.canDelete).toBe(true)
    })

    it('should allow delete for PARTIAL invoice without payments (edge case)', () => {
      const result = canDeleteInvoice('PARTIAL', false)
      expect(result.canDelete).toBe(true)
    })

    it('should not allow delete for invoice with payments', () => {
      const result = canDeleteInvoice('PENDING', true)
      expect(result.canDelete).toBe(false)
      expect(result.reason).toBe('No se puede eliminar una factura con pagos registrados')
    })

    it('should not allow delete for PAID invoice', () => {
      const result = canDeleteInvoice('PAID', false)
      expect(result.canDelete).toBe(false)
      expect(result.reason).toBe('No se puede eliminar una factura pagada')
    })

    it('should not allow delete for PAID invoice even without payments (edge case)', () => {
      const result = canDeleteInvoice('PAID', false)
      expect(result.canDelete).toBe(false)
    })
  })

  describe('canAddPayment', () => {
    it('should allow payment for PENDING invoice', () => {
      const result = canAddPayment('PENDING')
      expect(result.canAdd).toBe(true)
    })

    it('should allow payment for PARTIAL invoice', () => {
      const result = canAddPayment('PARTIAL')
      expect(result.canAdd).toBe(true)
    })

    it('should not allow payment for CANCELLED invoice', () => {
      const result = canAddPayment('CANCELLED')
      expect(result.canAdd).toBe(false)
      expect(result.reason).toBe('No se puede pagar una factura cancelada')
    })

    it('should allow payment for PAID invoice (edge case - overpayment)', () => {
      const result = canAddPayment('PAID')
      expect(result.canAdd).toBe(true)
    })
  })

  describe('generateInvoiceNumber', () => {
    it('should generate first invoice number when no previous exists', () => {
      expect(generateInvoiceNumber(null)).toBe('INV-000001')
    })

    it('should generate next sequential number', () => {
      expect(generateInvoiceNumber('INV-000001')).toBe('INV-000002')
    })

    it('should handle larger numbers', () => {
      expect(generateInvoiceNumber('INV-000099')).toBe('INV-000100')
    })

    it('should handle very large numbers', () => {
      expect(generateInvoiceNumber('INV-999999')).toBe('INV-1000000')
    })

    it('should handle malformed previous number gracefully', () => {
      expect(generateInvoiceNumber('INVALID')).toBe('INV-000001')
    })
  })
})
