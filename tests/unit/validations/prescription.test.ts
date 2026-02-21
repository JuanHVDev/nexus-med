import { describe, it, expect } from 'vitest'
import {
	medicationSchema,
	prescriptionSchema,
	prescriptionInputSchema,
	prescriptionFilterSchema,
} from '@/lib/validations/prescription'

describe('prescription validation', () => {
	describe('medicationSchema', () => {
		it('should validate a correct medication', () => {
			const validInput = {
				name: 'Paracetamol',
				dosage: '500mg',
				route: 'Oral',
				frequency: 'Cada 8 horas',
				duration: '5 días',
				instructions: 'Tomar con alimentos',
			}

			const result = medicationSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate medication with required fields only', () => {
			const validInput = {
				name: 'Paracetamol',
				dosage: '500mg',
				route: 'Oral',
			}

			const result = medicationSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject missing name', () => {
			const invalidInput = {
				dosage: '500mg',
				route: 'Oral',
			}

			const result = medicationSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing dosage', () => {
			const invalidInput = {
				name: 'Paracetamol',
				route: 'Oral',
			}

			const result = medicationSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing route', () => {
			const invalidInput = {
				name: 'Paracetamol',
				dosage: '500mg',
			}

			const result = medicationSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject empty name', () => {
			const invalidInput = {
				name: '',
				dosage: '500mg',
				route: 'Oral',
			}

			const result = medicationSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})

	describe('prescriptionInputSchema', () => {
		it('should validate a correct prescription input', () => {
			const validInput = {
				patientId: '123',
				medicalNoteId: '456',
				medications: [
					{
						name: 'Paracetamol',
						dosage: '500mg',
						route: 'Oral',
					},
				],
			}

			const result = prescriptionInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with all optional fields', () => {
			const validInput = {
				patientId: '123',
				medicalNoteId: '456',
				medications: [
					{
						name: 'Paracetamol',
						dosage: '500mg',
						route: 'Oral',
						frequency: 'Cada 8 horas',
						duration: '5 días',
						instructions: 'Tomar con alimentos',
					},
				],
				instructions: 'Mantener hidratación',
				validUntil: '2024-12-31',
			}

			const result = prescriptionInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with multiple medications', () => {
			const validInput = {
				patientId: '123',
				medicalNoteId: '456',
				medications: [
					{
						name: 'Paracetamol',
						dosage: '500mg',
						route: 'Oral',
					},
					{
						name: 'Amoxicilina',
						dosage: '500mg',
						route: 'Oral',
					},
				],
			}

			const result = prescriptionInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject missing patientId', () => {
			const invalidInput = {
				medicalNoteId: '456',
				medications: [
					{
						name: 'Paracetamol',
						dosage: '500mg',
						route: 'Oral',
					},
				],
			}

			const result = prescriptionInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing medicalNoteId', () => {
			const invalidInput = {
				patientId: '123',
				medications: [
					{
						name: 'Paracetamol',
						dosage: '500mg',
						route: 'Oral',
					},
				],
			}

			const result = prescriptionInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject empty medications array', () => {
			const invalidInput = {
				patientId: '123',
				medicalNoteId: '456',
				medications: [],
			}

			const result = prescriptionInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject medications with invalid item', () => {
			const invalidInput = {
				patientId: '123',
				medicalNoteId: '456',
				medications: [
					{
						name: '',
						dosage: '500mg',
						route: 'Oral',
					},
				],
			}

			const result = prescriptionInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})

	describe('prescriptionSchema (with transform)', () => {
		it('should transform patientId to BigInt', () => {
			const validInput = {
				patientId: '123',
				medicalNoteId: '456',
				medications: [
					{
						name: 'Paracetamol',
						dosage: '500mg',
						route: 'Oral',
					},
				],
			}

			const result = prescriptionSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.patientId).toBe(BigInt(123))
			}
		})

		it('should transform medicalNoteId to BigInt', () => {
			const validInput = {
				patientId: '123',
				medicalNoteId: '456',
				medications: [
					{
						name: 'Paracetamol',
						dosage: '500mg',
						route: 'Oral',
					},
				],
			}

			const result = prescriptionSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.medicalNoteId).toBe(BigInt(456))
			}
		})

		it('should transform validUntil to Date when provided', () => {
			const validInput = {
				patientId: '123',
				medicalNoteId: '456',
				medications: [
					{
						name: 'Paracetamol',
						dosage: '500mg',
						route: 'Oral',
					},
				],
				validUntil: '2024-12-31',
			}

			const result = prescriptionSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.validUntil).toBeInstanceOf(Date)
			}
		})

		it('should not transform validUntil when not provided', () => {
			const validInput = {
				patientId: '123',
				medicalNoteId: '456',
				medications: [
					{
						name: 'Paracetamol',
						dosage: '500mg',
						route: 'Oral',
					},
				],
			}

			const result = prescriptionSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.validUntil).toBeUndefined()
			}
		})
	})

	describe('prescriptionFilterSchema', () => {
		it('should validate empty filter', () => {
			const validInput = {}

			const result = prescriptionFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate filter with patientId', () => {
			const validInput = {
				patientId: '123',
			}

			const result = prescriptionFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate filter with doctorId', () => {
			const validInput = {
				doctorId: '456',
			}

			const result = prescriptionFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate filter with date range', () => {
			const validInput = {
				startDate: '2024-01-01',
				endDate: '2024-12-31',
			}

			const result = prescriptionFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate filter with search', () => {
			const validInput = {
				search: 'Paracetamol',
			}

			const result = prescriptionFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate filter with all fields', () => {
			const validInput = {
				patientId: '123',
				doctorId: '456',
				startDate: '2024-01-01',
				endDate: '2024-12-31',
				search: 'Paracetamol',
			}

			const result = prescriptionFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})
	})
})
