import { describe, it, expect } from 'vitest'
import {
	patientSchema,
	patientInputSchema,
	emergencyContactSchema,
	patientEditInputSchema,
	vitalSignsSchema,
	medicalHistorySchema,
} from '@/lib/validations/patient'

describe('patient validation', () => {
	describe('patientInputSchema', () => {
		it('should validate a correct patient input', () => {
			const validInput = {
				firstName: 'Juan',
				lastName: 'Pérez',
				birthDate: '1990-01-15',
				gender: 'MALE' as const,
				email: 'juan@example.com',
				phone: '1234567890',
			}

			const result = patientInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate patient with all optional fields', () => {
			const validInput = {
				firstName: 'Juan',
				lastName: 'Pérez',
				middleName: 'Carlos',
				curp: 'AAAA010101HNEXXXA1',
				birthDate: '1990-01-15',
				gender: 'MALE' as const,
				bloodType: 'O_POSITIVE' as const,
				email: 'juan@example.com',
				phone: '1234567890',
				mobile: '0987654321',
				address: 'Calle 123',
				city: 'México',
				state: 'CDMX',
				zipCode: '12345',
				notes: 'Notas del paciente',
			}

			const result = patientInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject short firstName', () => {
			const invalidInput = {
				firstName: 'J',
				lastName: 'Pérez',
				birthDate: '1990-01-15',
				gender: 'MALE' as const,
			}

			const result = patientInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('firstName')
			}
		})

		it('should reject short lastName', () => {
			const invalidInput = {
				firstName: 'Juan',
				lastName: 'P',
				birthDate: '1990-01-15',
				gender: 'MALE' as const,
			}

			const result = patientInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject invalid CURP format', () => {
			const invalidInput = {
				firstName: 'Juan',
				lastName: 'Pérez',
				curp: 'INVALID',
				birthDate: '1990-01-15',
				gender: 'MALE' as const,
			}

			const result = patientInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should accept valid CURP format', () => {
			const validInput = {
				firstName: 'Juan',
				lastName: 'Pérez',
				curp: 'AAAA010101HNEXXXA1',
				birthDate: '1990-01-15',
				gender: 'MALE' as const,
			}

			const result = patientInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should accept empty CURP', () => {
			const validInput = {
				firstName: 'Juan',
				lastName: 'Pérez',
				curp: '',
				birthDate: '1990-01-15',
				gender: 'MALE' as const,
			}

			const result = patientInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject invalid gender', () => {
			const invalidInput = {
				firstName: 'Juan',
				lastName: 'Pérez',
				birthDate: '1990-01-15',
				gender: 'INVALID' as never,
			}

			const result = patientInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject invalid bloodType', () => {
			const invalidInput = {
				firstName: 'Juan',
				lastName: 'Pérez',
				birthDate: '1990-01-15',
				gender: 'MALE' as const,
				bloodType: 'INVALID' as never,
			}

			const result = patientInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject invalid email format', () => {
			const invalidInput = {
				firstName: 'Juan',
				lastName: 'Pérez',
				birthDate: '1990-01-15',
				gender: 'MALE' as const,
				email: 'not-an-email',
			}

			const result = patientInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing required fields', () => {
			const invalidInput = {
				firstName: 'Juan',
			}

			const result = patientInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should accept optional fields as undefined', () => {
			const validInput = {
				firstName: 'Juan',
				lastName: 'Pérez',
				birthDate: '1990-01-15',
				gender: 'MALE' as const,
				email: undefined,
				phone: undefined,
			}

			const result = patientInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})
	})

	describe('patientSchema (with transform)', () => {
		it('should transform birthDate to Date object', () => {
			const validInput = {
				firstName: 'Juan',
				lastName: 'Pérez',
				birthDate: '1990-01-15',
				gender: 'MALE' as const,
			}

			const result = patientSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.birthDate).toBeInstanceOf(Date)
			}
		})
	})

	describe('emergencyContactSchema', () => {
		it('should validate a correct emergency contact', () => {
			const validInput = {
				name: 'María Pérez',
				relation: 'Madre',
				phone: '1234567890',
				email: 'maria@example.com',
				isPrimary: true,
			}

			const result = emergencyContactSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject short name', () => {
			const invalidInput = {
				name: 'M',
				relation: 'Madre',
				phone: '1234567890',
			}

			const result = emergencyContactSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject short relation', () => {
			const invalidInput = {
				name: 'María',
				relation: 'M',
				phone: '1234567890',
			}

			const result = emergencyContactSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject short phone', () => {
			const invalidInput = {
				name: 'María',
				relation: 'Madre',
				phone: '123',
			}

			const result = emergencyContactSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject invalid email', () => {
			const invalidInput = {
				name: 'María',
				relation: 'Madre',
				phone: '1234567890',
				email: 'invalid',
			}

			const result = emergencyContactSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should default isPrimary to false', () => {
			const validInput = {
				name: 'María',
				relation: 'Madre',
				phone: '1234567890',
			}

			const result = emergencyContactSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.isPrimary).toBe(false)
			}
		})

		it('should accept empty email', () => {
			const validInput = {
				name: 'María',
				relation: 'Madre',
				phone: '1234567890',
				email: '',
			}

			const result = emergencyContactSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})
	})

	describe('patientEditInputSchema', () => {
		it('should validate partial patient edit input', () => {
			const validInput = {
				firstName: 'Juan',
			}

			const result = patientEditInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should allow all fields to be optional', () => {
			const validInput = {}

			const result = patientEditInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})
	})

	describe('vitalSignsSchema', () => {
		it('should validate valid vital signs', () => {
			const validInput = {
				bloodPressureSystolic: 120,
				bloodPressureDiastolic: 80,
				heartRate: 72,
				temperature: 36.5,
				weight: 70,
				height: 170,
				bmi: 24.2,
				oxygenSaturation: 98,
				glucose: 100,
			}

			const result = vitalSignsSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should accept empty vital signs', () => {
			const validInput = {}

			const result = vitalSignsSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject out of range bloodPressureSystolic', () => {
			const invalidInput = {
				bloodPressureSystolic: 300,
			}

			const result = vitalSignsSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject out of range heartRate', () => {
			const invalidInput = {
				heartRate: 250,
			}

			const result = vitalSignsSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject out of range temperature', () => {
			const invalidInput = {
				temperature: 50,
			}

			const result = vitalSignsSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject out of range oxygenSaturation', () => {
			const invalidInput = {
				oxygenSaturation: 40,
			}

			const result = vitalSignsSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})

	describe('medicalHistorySchema', () => {
		it('should validate complete medical history', () => {
			const validInput = {
				allergies: ['Penicillin', 'Peanuts'],
				currentMedications: ['Aspirin'],
				chronicDiseases: ['Diabetes'],
				surgeries: ['Appendectomy'],
				familyHistory: 'Hypertension',
				personalHistory: 'No relevant history',
				smoking: true,
				alcohol: false,
				drugs: false,
				exercise: '3 times per week',
				balanced: 'Vegetarian',
			}

			const result = medicalHistorySchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should accept empty medical history', () => {
			const validInput = {}

			const result = medicalHistorySchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should default arrays to empty arrays', () => {
			const validInput = {}

			const result = medicalHistorySchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.allergies).toEqual([])
				expect(result.data.currentMedications).toEqual([])
				expect(result.data.chronicDiseases).toEqual([])
				expect(result.data.surgeries).toEqual([])
			}
		})

		it('should default booleans to false', () => {
			const validInput = {}

			const result = medicalHistorySchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.smoking).toBe(false)
				expect(result.data.alcohol).toBe(false)
				expect(result.data.drugs).toBe(false)
			}
		})

		it('should accept vital signs in medical history', () => {
			const validInput = {
				vitalSigns: {
					bloodPressureSystolic: 120,
					heartRate: 72,
				},
			}

			const result = medicalHistorySchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})
	})
})
