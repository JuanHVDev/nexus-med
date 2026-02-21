import { describe, it, expect } from 'vitest'
import {
	labTestSchema,
	labOrderCreateSchema,
	labOrderUpdateSchema,
	labResultSchema,
	labResultCreateSchema,
} from '@/lib/validations/lab-order'

describe('lab-order validation', () => {
	describe('labTestSchema', () => {
		it('should validate a correct lab test', () => {
			const validInput = {
				name: 'Biometría hemática',
				code: 'BH001',
				price: 250,
			}

			const result = labTestSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with required fields only', () => {
			const validInput = {
				name: 'Biometría hemática',
			}

			const result = labTestSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject missing name', () => {
			const invalidInput = {
				code: 'BH001',
				price: 250,
			}

			const result = labTestSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject empty name', () => {
			const invalidInput = {
				name: '',
			}

			const result = labTestSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})

	describe('labOrderCreateSchema', () => {
		it('should validate a correct lab order', () => {
			const validInput = {
				patientId: '123',
				doctorId: '456',
				tests: [
					{
						name: 'Biometría hemática',
					},
				],
			}

			const result = labOrderCreateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with all optional fields', () => {
			const validInput = {
				patientId: '123',
				doctorId: '456',
				medicalNoteId: '789',
				tests: [
					{
						name: 'Biometría hemática',
						code: 'BH001',
						price: 250,
					},
					{
						name: 'Química sanguínea',
						code: 'QS001',
						price: 350,
					},
				],
				instructions: 'Ayuno de 12 horas',
			}

			const result = labOrderCreateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject missing patientId', () => {
			const invalidInput = {
				doctorId: '456',
				tests: [
					{
						name: 'Biometría hemática',
					},
				],
			}

			const result = labOrderCreateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing doctorId', () => {
			const invalidInput = {
				patientId: '123',
				tests: [
					{
						name: 'Biometría hemática',
					},
				],
			}

			const result = labOrderCreateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject empty tests array', () => {
			const invalidInput = {
				patientId: '123',
				doctorId: '456',
				tests: [],
			}

			const result = labOrderCreateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject tests with invalid test', () => {
			const invalidInput = {
				patientId: '123',
				doctorId: '456',
				tests: [
					{
						name: '',
					},
				],
			}

			const result = labOrderCreateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should accept null instructions', () => {
			const validInput = {
				patientId: '123',
				doctorId: '456',
				tests: [{ name: 'Biometría hemática' }],
				instructions: null,
			}

			const result = labOrderCreateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})
	})

	describe('labOrderUpdateSchema', () => {
		it('should validate partial update with status', () => {
			const validInput = {
				status: 'COMPLETED' as const,
			}

			const result = labOrderUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with multiple fields', () => {
			const validInput = {
				status: 'IN_PROGRESS' as const,
				instructions: 'Nueva instrucción',
				resultsFileUrl: 'https://example.com/results.pdf',
				resultsFileName: 'results.pdf',
			}

			const result = labOrderUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should accept null for file fields', () => {
			const validInput = {
				resultsFileUrl: null,
				resultsFileName: null,
			}

			const result = labOrderUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with all optional fields', () => {
			const validInput = {}

			const result = labOrderUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject invalid status', () => {
			const invalidInput = {
				status: 'INVALID' as never,
			}

			const result = labOrderUpdateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should accept all valid statuses', () => {
			const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const

			statuses.forEach((status) => {
				const validInput = { status }
				const result = labOrderUpdateSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})
		})
	})

	describe('labResultSchema', () => {
		it('should validate a correct lab result', () => {
			const validInput = {
				testName: 'Glucosa',
				result: '95',
				unit: 'mg/dL',
				referenceRange: '70-100',
				flag: 'NORMAL' as const,
			}

			const result = labResultSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with required fields only', () => {
			const validInput = {
				testName: 'Glucosa',
			}

			const result = labResultSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject missing testName', () => {
			const invalidInput = {
				result: '95',
			}

			const result = labResultSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should accept all valid flags', () => {
			const flags = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as const

			flags.forEach((flag) => {
				const validInput = { testName: 'Glucosa', flag }
				const result = labResultSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})
		})

		it('should reject invalid flag', () => {
			const invalidInput = {
				testName: 'Glucosa',
				flag: 'INVALID' as never,
			}

			const result = labResultSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})

	describe('labResultCreateSchema', () => {
		it('should validate a correct lab result creation', () => {
			const validInput = {
				results: [
					{
						testName: 'Glucosa',
						result: '95',
					},
					{
						testName: 'Urea',
						result: '30',
					},
				],
			}

			const result = labResultCreateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject empty results array', () => {
			const invalidInput = {
				results: [],
			}

			const result = labResultCreateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject results with invalid result', () => {
			const invalidInput = {
				results: [
					{
						testName: 'Glucosa',
						result: '95',
					},
					{
						testName: '',
					},
				],
			}

			const result = labResultCreateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should validate with single result', () => {
			const validInput = {
				results: [
					{
						testName: 'Glucosa',
						result: '95',
					},
				],
			}

			const result = labResultCreateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})
	})
})
