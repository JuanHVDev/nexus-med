import { describe, it, expect } from 'vitest'
import {
	imagingOrderCreateSchema,
	imagingOrderUpdateSchema,
	STUDY_TYPES,
} from '@/lib/validations/imaging-order'

describe('imaging-order validation', () => {
	describe('STUDY_TYPES', () => {
		it('should contain expected study types', () => {
			expect(STUDY_TYPES).toContainEqual({ value: 'RX', label: 'Radiografía Simple' })
			expect(STUDY_TYPES).toContainEqual({ value: 'USG', label: 'Ultrasonido' })
			expect(STUDY_TYPES).toContainEqual({ value: 'TAC', label: 'Tomografía (TAC)' })
			expect(STUDY_TYPES).toContainEqual({ value: 'RM', label: 'Resonancia Magnética (RM)' })
			expect(STUDY_TYPES).toContainEqual({ value: 'ECG', label: 'Electrocardiograma (ECG)' })
			expect(STUDY_TYPES).toContainEqual({ value: 'EO', label: 'Espirometría' })
			expect(STUDY_TYPES).toContainEqual({ value: 'MAM', label: 'Mastografía' })
			expect(STUDY_TYPES).toContainEqual({ value: 'DENS', label: 'Densitometría Ósea' })
			expect(STUDY_TYPES).toContainEqual({ value: 'OTRO', label: 'Otro' })
		})

		it('should have correct number of study types', () => {
			expect(STUDY_TYPES.length).toBe(9)
		})

		it('should have value and label for each type', () => {
			STUDY_TYPES.forEach((type) => {
				expect(type).toHaveProperty('value')
				expect(type).toHaveProperty('label')
				expect(typeof type.value).toBe('string')
				expect(typeof type.label).toBe('string')
			})
		})
	})

	describe('imagingOrderCreateSchema', () => {
		it('should validate a correct imaging order', () => {
			const validInput = {
				patientId: '123',
				doctorId: '456',
				studyType: 'RX',
				bodyPart: 'Tórax',
			}

			const result = imagingOrderCreateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with all optional fields', () => {
			const validInput = {
				patientId: '123',
				doctorId: '456',
				medicalNoteId: '789',
				studyType: 'TAC',
				bodyPart: 'Abdomen',
				reason: 'Dolor abdominal',
				clinicalNotes: 'Paciente con dolor en FID',
			}

			const result = imagingOrderCreateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should accept null for reason and clinicalNotes', () => {
			const validInput = {
				patientId: '123',
				doctorId: '456',
				studyType: 'RX',
				bodyPart: 'Tórax',
				reason: null,
				clinicalNotes: null,
			}

			const result = imagingOrderCreateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject missing patientId', () => {
			const invalidInput = {
				doctorId: '456',
				studyType: 'RX',
				bodyPart: 'Tórax',
			}

			const result = imagingOrderCreateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing doctorId', () => {
			const invalidInput = {
				patientId: '123',
				studyType: 'RX',
				bodyPart: 'Tórax',
			}

			const result = imagingOrderCreateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing studyType', () => {
			const invalidInput = {
				patientId: '123',
				doctorId: '456',
				bodyPart: 'Tórax',
			}

			const result = imagingOrderCreateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing bodyPart', () => {
			const invalidInput = {
				patientId: '123',
				doctorId: '456',
				studyType: 'RX',
			}

			const result = imagingOrderCreateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should accept all study types', () => {
			STUDY_TYPES.forEach((type) => {
				const validInput = {
					patientId: '123',
					doctorId: '456',
					studyType: type.value,
					bodyPart: 'Test',
				}
				const result = imagingOrderCreateSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})
		})

		it('should reject empty patientId', () => {
			const invalidInput = {
				patientId: '',
				doctorId: '456',
				studyType: 'RX',
				bodyPart: 'Tórax',
			}

			const result = imagingOrderCreateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject empty studyType', () => {
			const invalidInput = {
				patientId: '123',
				doctorId: '456',
				studyType: '',
				bodyPart: 'Tórax',
			}

			const result = imagingOrderCreateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject empty bodyPart', () => {
			const invalidInput = {
				patientId: '123',
				doctorId: '456',
				studyType: 'RX',
				bodyPart: '',
			}

			const result = imagingOrderCreateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})

	describe('imagingOrderUpdateSchema', () => {
		it('should validate partial update with status', () => {
			const validInput = {
				status: 'COMPLETED' as const,
			}

			const result = imagingOrderUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with all fields', () => {
			const validInput = {
				status: 'COMPLETED' as const,
				reportUrl: 'https://example.com/report.pdf',
				imagesUrl: 'https://example.com/images.zip',
				reportFileName: 'report.pdf',
				imagesFileName: 'images.zip',
				findings: 'Hallazgos normales',
				impression: 'Estudio dentro de límites normales',
			}

			const result = imagingOrderUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should accept null for file fields', () => {
			const validInput = {
				reportUrl: null,
				imagesUrl: null,
				reportFileName: null,
				imagesFileName: null,
			}

			const result = imagingOrderUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with all optional fields', () => {
			const validInput = {}

			const result = imagingOrderUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject invalid status', () => {
			const invalidInput = {
				status: 'INVALID' as never,
			}

			const result = imagingOrderUpdateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should accept all valid statuses', () => {
			const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const

			statuses.forEach((status) => {
				const validInput = { status }
				const result = imagingOrderUpdateSchema.safeParse(validInput)
				expect(result.success).toBe(true)
			})
		})

		it('should allow updating findings only', () => {
			const validInput = {
				findings: 'Opacidad en lóbulo superior derecho',
			}

			const result = imagingOrderUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should allow updating impression only', () => {
			const validInput = {
				impression: 'Sugiere neumonía',
			}

			const result = imagingOrderUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should allow uploading report only', () => {
			const validInput = {
				reportUrl: 'https://example.com/report.pdf',
				reportFileName: 'report.pdf',
			}

			const result = imagingOrderUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})
	})
})
