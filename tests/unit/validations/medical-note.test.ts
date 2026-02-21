import { describe, it, expect } from 'vitest'
import {
	medicalNoteSchema,
	medicalNoteInputSchema,
	medicalNoteUpdateSchema,
	medicalNoteUpdateTransform,
	vitalSignsSchema,
	specialties,
	specialtyLabels,
	noteTypeEnum,
	templateFields,
} from '@/lib/validations/medical-note'

describe('medical-note validation', () => {
	describe('specialties', () => {
		it('should contain all expected specialties', () => {
			expect(specialties).toContain('GENERAL')
			expect(specialties).toContain('PEDIATRICS')
			expect(specialties).toContain('CARDIOLOGY')
			expect(specialties).toContain('DERMATOLOGY')
			expect(specialties).toContain('GYNECOLOGY')
			expect(specialties).toContain('ORTHOPEDICS')
			expect(specialties).toContain('NEUROLOGY')
			expect(specialties).toContain('OPHTHALMOLOGY')
			expect(specialties).toContain('OTORHINOLARYNGOLOGY')
			expect(specialties).toContain('PSYCHIATRY')
		})

		it('should have correct length', () => {
			expect(specialties.length).toBe(10)
		})
	})

	describe('specialtyLabels', () => {
		it('should have labels for all specialties', () => {
			specialties.forEach((specialty) => {
				expect(specialtyLabels[specialty]).toBeDefined()
				expect(typeof specialtyLabels[specialty]).toBe('string')
			})
		})

		it('should have Spanish labels', () => {
			expect(specialtyLabels.GENERAL).toBe('Medicina General')
			expect(specialtyLabels.PEDIATRICS).toBe('Pediatría')
			expect(specialtyLabels.CARDIOLOGY).toBe('Cardiología')
		})
	})

	describe('noteTypeEnum', () => {
		it('should contain all note types', () => {
			expect(noteTypeEnum).toContain('CONSULTATION')
			expect(noteTypeEnum).toContain('FOLLOWUP')
			expect(noteTypeEnum).toContain('EMERGENCY')
			expect(noteTypeEnum).toContain('PROCEDURE')
		})
	})

	describe('templateFields', () => {
		it('should have template for all specialties', () => {
			specialties.forEach((specialty) => {
				expect(templateFields[specialty]).toBeDefined()
			})
		})

		it('should have requiredPhysicalExam for each specialty', () => {
			specialties.forEach((specialty) => {
				expect(templateFields[specialty].requiredPhysicalExam).toBeDefined()
				expect(Array.isArray(templateFields[specialty].requiredPhysicalExam)).toBe(true)
				expect(templateFields[specialty].requiredPhysicalExam.length).toBeGreaterThan(0)
			})
		})

		it('should have defaultNotes for each specialty', () => {
			specialties.forEach((specialty) => {
				expect(templateFields[specialty].defaultNotes).toBeDefined()
				expect(typeof templateFields[specialty].defaultNotes).toBe('string')
			})
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
				oxygenSaturation: 98,
				respiratoryRate: 16,
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

		it('should reject out of range bloodPressureDiastolic', () => {
			const invalidInput = {
				bloodPressureDiastolic: 200,
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

		it('should reject out of range respiratoryRate', () => {
			const invalidInput = {
				respiratoryRate: 5,
			}

			const result = vitalSignsSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})

	describe('medicalNoteInputSchema', () => {
		it('should validate a correct medical note input', () => {
			const validInput = {
				patientId: '123',
				chiefComplaint: 'Dolor de cabeza',
				diagnosis: 'Migraña',
			}

			const result = medicalNoteInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with all optional fields', () => {
			const validInput = {
				patientId: '123',
				appointmentId: '456',
				specialty: 'CARDIOLOGY' as const,
				type: 'CONSULTATION' as const,
				chiefComplaint: 'Dolor en el pecho',
				currentIllness: 'Paciente refiere dolor torácico',
				vitalSigns: {
					bloodPressureSystolic: 120,
					heartRate: 80,
				},
				physicalExam: 'Examen físico normal',
				diagnosis: 'Dolor torácico inespecífico',
				prognosis: 'Bueno',
				treatment: 'Analgesicos',
				notes: 'Seguimiento en 1 semana',
			}

			const result = medicalNoteInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject missing patientId', () => {
			const invalidInput = {
				chiefComplaint: 'Dolor de cabeza',
				diagnosis: 'Migraña',
			}

			const result = medicalNoteInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing chiefComplaint', () => {
			const invalidInput = {
				patientId: '123',
				diagnosis: 'Migraña',
			}

			const result = medicalNoteInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing diagnosis', () => {
			const invalidInput = {
				patientId: '123',
				chiefComplaint: 'Dolor de cabeza',
			}

			const result = medicalNoteInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject invalid specialty', () => {
			const invalidInput = {
				patientId: '123',
				chiefComplaint: 'Dolor de cabeza',
				diagnosis: 'Migraña',
				specialty: 'INVALID' as never,
			}

			const result = medicalNoteInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject invalid type', () => {
			const invalidInput = {
				patientId: '123',
				chiefComplaint: 'Dolor de cabeza',
				diagnosis: 'Migraña',
				type: 'INVALID' as never,
			}

			const result = medicalNoteInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject invalid vitalSigns', () => {
			const invalidInput = {
				patientId: '123',
				chiefComplaint: 'Dolor de cabeza',
				diagnosis: 'Migraña',
				vitalSigns: {
					bloodPressureSystolic: 500,
				},
			}

			const result = medicalNoteInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})

	describe('medicalNoteSchema (with transform)', () => {
		it('should transform patientId to BigInt', () => {
			const validInput = {
				patientId: '123',
				chiefComplaint: 'Dolor de cabeza',
				diagnosis: 'Migraña',
			}

			const result = medicalNoteSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.patientId).toBe(BigInt(123))
			}
		})

		it('should transform appointmentId to BigInt when provided', () => {
			const validInput = {
				patientId: '123',
				appointmentId: '456',
				chiefComplaint: 'Dolor de cabeza',
				diagnosis: 'Migraña',
			}

			const result = medicalNoteSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.appointmentId).toBe(BigInt(456))
			}
		})

		it('should not transform appointmentId when not provided', () => {
			const validInput = {
				patientId: '123',
				chiefComplaint: 'Dolor de cabeza',
				diagnosis: 'Migraña',
			}

			const result = medicalNoteSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.appointmentId).toBeUndefined()
			}
		})

		it('should stringify vitalSigns', () => {
			const validInput = {
				patientId: '123',
				chiefComplaint: 'Dolor de cabeza',
				diagnosis: 'Migraña',
				vitalSigns: {
					bloodPressureSystolic: 120,
					heartRate: 80,
				},
			}

			const result = medicalNoteSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(typeof result.data.vitalSigns).toBe('string')
			}
		})
	})

	describe('medicalNoteUpdateSchema', () => {
		it('should validate partial update', () => {
			const validInput = {
				diagnosis: 'Nuevo diagnóstico',
			}

			const result = medicalNoteUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with multiple fields', () => {
			const validInput = {
				treatment: 'Nuevo tratamiento',
				notes: 'Nuevas notas',
				prognosis: 'Bueno',
			}

			const result = medicalNoteUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should accept all fields optional', () => {
			const validInput = {}

			const result = medicalNoteUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})
	})

	describe('medicalNoteUpdateTransform', () => {
		it('should stringify vitalSigns', () => {
			const input = {
				vitalSigns: {
					bloodPressureSystolic: 120,
				},
			}

			const result = medicalNoteUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(typeof result.data.vitalSigns).toBe('string')
			}
		})

		it('should omit undefined fields', () => {
			const input = {
				diagnosis: 'Test',
				treatment: undefined,
			}

			const result = medicalNoteUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).not.toHaveProperty('treatment')
			}
		})

		it('should include string fields with empty values', () => {
			const input = {
				notes: '',
			}

			const result = medicalNoteUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).toHaveProperty('notes')
			}
		})

		it('should include specialty when provided', () => {
			const input = {
				specialty: 'CARDIOLOGY',
			}

			const result = medicalNoteUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.specialty).toBe('CARDIOLOGY')
			}
		})

		it('should include type when provided', () => {
			const input = {
				type: 'FOLLOWUP',
			}

			const result = medicalNoteUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.type).toBe('FOLLOWUP')
			}
		})

		it('should include chiefComplaint when provided', () => {
			const input = {
				chiefComplaint: 'Dolor de cabeza',
			}

			const result = medicalNoteUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.chiefComplaint).toBe('Dolor de cabeza')
			}
		})

		it('should include currentIllness when provided', () => {
			const input = {
				currentIllness: 'Enfermedad actual',
			}

			const result = medicalNoteUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.currentIllness).toBe('Enfermedad actual')
			}
		})

		it('should include physicalExam when provided', () => {
			const input = {
				physicalExam: 'Examen físico normal',
			}

			const result = medicalNoteUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.physicalExam).toBe('Examen físico normal')
			}
		})

		it('should include prognosis when provided', () => {
			const input = {
				prognosis: 'Bueno',
			}

			const result = medicalNoteUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.prognosis).toBe('Bueno')
			}
		})

		it('should include treatment when provided', () => {
			const input = {
				treatment: 'Medicación',
			}

			const result = medicalNoteUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.treatment).toBe('Medicación')
			}
		})

		it('should handle all fields at once', () => {
			const input = {
				specialty: 'GENERAL',
				type: 'CONSULTATION',
				chiefComplaint: 'Dolor',
				currentIllness: 'Enfermedad',
				vitalSigns: { bloodPressureSystolic: 120 },
				physicalExam: 'Normal',
				diagnosis: 'Diagnóstico',
				pronostico: 'Bueno',
				treatment: 'Tratamiento',
				notes: 'Notas',
			}

			const result = medicalNoteUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.specialty).toBe('GENERAL')
				expect(result.data.type).toBe('CONSULTATION')
			}
		})
	})
})
