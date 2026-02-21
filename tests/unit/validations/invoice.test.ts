import { describe, it, expect } from 'vitest'
import {
	invoiceItemSchema,
	invoiceInputSchema,
	invoiceSchema,
	invoiceUpdateSchema,
	invoiceFilterSchema,
	paymentSchema,
} from '@/lib/validations/invoice'

describe('invoice validation', () => {
	describe('invoiceItemSchema', () => {
		it('should validate a correct invoice item', () => {
			const validInput = {
				description: 'Consulta médica',
				quantity: 1,
				unitPrice: 500,
				discount: 0,
			}

			const result = invoiceItemSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate item with serviceId', () => {
			const validInput = {
				serviceId: '123',
				description: 'Consulta médica',
				quantity: 1,
				unitPrice: 500,
				discount: 50,
			}

			const result = invoiceItemSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject missing description', () => {
			const invalidInput = {
				quantity: 1,
				unitPrice: 500,
			}

			const result = invoiceItemSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject empty description', () => {
			const invalidInput = {
				description: '',
				quantity: 1,
				unitPrice: 500,
			}

			const result = invoiceItemSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject quantity less than 1', () => {
			const invalidInput = {
				description: 'Consulta',
				quantity: 0,
				unitPrice: 500,
			}

			const result = invoiceItemSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject negative unitPrice', () => {
			const invalidInput = {
				description: 'Consulta',
				quantity: 1,
				unitPrice: -100,
			}

			const result = invoiceItemSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject negative discount', () => {
			const invalidInput = {
				description: 'Consulta',
				quantity: 1,
				unitPrice: 500,
				discount: -50,
			}

			const result = invoiceItemSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})

	describe('invoiceInputSchema', () => {
		it('should validate a correct invoice input', () => {
			const validInput = {
				patientId: '123',
				items: [
					{
						description: 'Consulta médica',
						quantity: 1,
						unitPrice: 500,
						discount: 0,
					},
				],
			}

			const result = invoiceInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with all optional fields', () => {
			const validInput = {
				patientId: '123',
				dueDate: '2024-12-31',
				notes: 'Notas de la factura',
				items: [
					{
						description: 'Consulta médica',
						quantity: 1,
						unitPrice: 500,
						discount: 0,
					},
				],
			}

			const result = invoiceInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with multiple items', () => {
			const validInput = {
				patientId: '123',
				items: [
					{
						description: 'Consulta médica',
						quantity: 1,
						unitPrice: 500,
						discount: 0,
					},
					{
						description: 'Análisis de sangre',
						quantity: 2,
						unitPrice: 250,
						discount: 0,
					},
				],
			}

			const result = invoiceInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject empty items array', () => {
			const invalidInput = {
				items: [],
			}

			const result = invoiceInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject items with invalid item', () => {
			const invalidInput = {
				items: [
					{
						description: '',
						quantity: 1,
						unitPrice: 500,
					},
				],
			}

			const result = invoiceInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})

	describe('invoiceSchema (with transform)', () => {
		it('should transform patientId to BigInt', () => {
			const validInput = {
				patientId: '123',
				items: [
					{
						description: 'Consulta',
						quantity: 1,
						unitPrice: 500,
						discount: 0,
					},
				],
			}

			const result = invoiceSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.patientId).toBe(BigInt(123))
			}
		})

		it('should transform serviceId in items to BigInt', () => {
			const validInput = {
				patientId: '123',
				items: [
					{
						serviceId: '456',
						description: 'Consulta',
						quantity: 1,
						unitPrice: 500,
						discount: 0,
					},
				],
			}

			const result = invoiceSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.items[0].serviceId).toBe(BigInt(456))
			}
		})

		it('should calculate total for each item', () => {
			const validInput = {
				patientId: '123',
				items: [
					{
						description: 'Consulta',
						quantity: 2,
						unitPrice: 500,
						discount: 100,
					},
				],
			}

			const result = invoiceSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.items[0].total).toBe(900)
			}
		})

		it('should transform dueDate to Date when provided', () => {
			const validInput = {
				patientId: '123',
				dueDate: '2024-12-31',
				items: [
					{
						description: 'Consulta',
						quantity: 1,
						unitPrice: 500,
						discount: 0,
					},
				],
			}

			const result = invoiceSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.dueDate).toBeInstanceOf(Date)
			}
		})
	})

	describe('invoiceUpdateSchema', () => {
		it('should validate partial update with status', () => {
			const validInput = {
				status: 'PAID' as const,
			}

			const result = invoiceUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with multiple fields', () => {
			const validInput = {
				status: 'PAID' as const,
				dueDate: '2024-12-31',
				notes: 'Notas actualizadas',
			}

			const result = invoiceUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with all optional fields', () => {
			const validInput = {}

			const result = invoiceUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject invalid status', () => {
			const invalidInput = {
				status: 'INVALID' as never,
			}

			const result = invoiceUpdateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should accept all valid statuses', () => {
			const statuses = ['PENDING', 'PAID', 'PARTIAL', 'CANCELLED'] as const

			statuses.forEach((status) => {
				const validInput = { status }
				const result = invoiceUpdateSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})
		})
	})

	describe('invoiceFilterSchema', () => {
		it('should validate empty filter', () => {
			const validInput = {}

			const result = invoiceFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate filter with patientId', () => {
			const validInput = {
				patientId: '123',
			}

			const result = invoiceFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate filter with status', () => {
			const validInput = {
				status: 'PAID' as const,
			}

			const result = invoiceFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate filter with date range', () => {
			const validInput = {
				startDate: '2024-01-01',
				endDate: '2024-12-31',
			}

			const result = invoiceFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate filter with all fields', () => {
			const validInput = {
				patientId: '123',
				status: 'PAID' as const,
				startDate: '2024-01-01',
				endDate: '2024-12-31',
			}

			const result = invoiceFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})
	})

	describe('paymentSchema', () => {
		it('should validate a correct payment', () => {
			const validInput = {
				amount: 500,
				method: 'CASH' as const,
			}

			const result = paymentSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with all optional fields', () => {
			const validInput = {
				amount: 500,
				method: 'TRANSFER' as const,
				reference: 'TRX123456',
				notes: 'Pago realizado',
			}

			const result = paymentSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject missing amount', () => {
			const invalidInput = {
				method: 'CASH' as const,
			}

			const result = paymentSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject zero amount', () => {
			const invalidInput = {
				amount: 0,
				method: 'CASH' as const,
			}

			const result = paymentSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject negative amount', () => {
			const invalidInput = {
				amount: -100,
				method: 'CASH' as const,
			}

			const result = paymentSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing method', () => {
			const invalidInput = {
				amount: 500,
			}

			const result = paymentSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject invalid method', () => {
			const invalidInput = {
				amount: 500,
				method: 'INVALID' as never,
			}

			const result = paymentSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should accept all valid payment methods', () => {
			const methods = ['CASH', 'CARD', 'TRANSFER', 'CHECK'] as const

			methods.forEach((method) => {
				const validInput = { amount: 500, method }
				const result = paymentSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})
		})
	})
})
