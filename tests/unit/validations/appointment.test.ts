import { describe, it, expect } from 'vitest'
import {
	appointmentSchema,
	appointmentInputSchema,
	appointmentUpdateSchema,
	appointmentUpdateTransform,
	appointmentFilterSchema,
	appointmentStatusEnum,
} from '@/lib/validations/appointment'

describe('appointment validation', () => {
	describe('appointmentInputSchema', () => {
		it('should validate a correct appointment input', () => {
			const validInput = {
				patientId: '123',
				doctorId: '456',
				startTime: '2024-01:00:00-15T10',
				endTime: '2024-01-15T10:30:00',
				status: 'SCHEDULED' as const,
				reason: 'Consulta general',
			}

			const result = appointmentInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with all optional fields', () => {
			const validInput = {
				patientId: '123',
				doctorId: '456',
				startTime: '2024-01-15T10:00:00',
				endTime: '2024-01-15T10:30:00',
				status: 'CONFIRMED' as const,
				reason: 'Consulta general',
				notes: 'Notas adicionales',
			}

			const result = appointmentInputSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject missing patientId', () => {
			const invalidInput = {
				doctorId: '456',
				startTime: '2024-01-15T10:00:00',
				endTime: '2024-01-15T10:30:00',
				status: 'SCHEDULED' as const,
			}

			const result = appointmentInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing doctorId', () => {
			const invalidInput = {
				patientId: '123',
				startTime: '2024-01-15T10:00:00',
				endTime: '2024-01-15T10:30:00',
				status: 'SCHEDULED' as const,
			}

			const result = appointmentInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing startTime', () => {
			const invalidInput = {
				patientId: '123',
				doctorId: '456',
				endTime: '2024-01-15T10:30:00',
				status: 'SCHEDULED' as const,
			}

			const result = appointmentInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing endTime', () => {
			const invalidInput = {
				patientId: '123',
				doctorId: '456',
				startTime: '2024-01-15T10:00:00',
				status: 'SCHEDULED' as const,
			}

			const result = appointmentInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject empty patientId', () => {
			const invalidInput = {
				patientId: '',
				doctorId: '456',
				startTime: '2024-01-15T10:00:00',
				endTime: '2024-01-15T10:30:00',
				status: 'SCHEDULED' as const,
			}

			const result = appointmentInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject invalid status', () => {
			const invalidInput = {
				patientId: '123',
				doctorId: '456',
				startTime: '2024-01-15T10:00:00',
				endTime: '2024-01-15T10:30:00',
				status: 'INVALID' as never,
			}

			const result = appointmentInputSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})

	describe('appointmentStatusEnum', () => {
		it('should contain all valid statuses', () => {
			expect(appointmentStatusEnum).toContain('SCHEDULED')
			expect(appointmentStatusEnum).toContain('CONFIRMED')
			expect(appointmentStatusEnum).toContain('IN_PROGRESS')
			expect(appointmentStatusEnum).toContain('COMPLETED')
			expect(appointmentStatusEnum).toContain('CANCELLED')
			expect(appointmentStatusEnum).toContain('NO_SHOW')
		})

		it('should have correct length', () => {
			expect(appointmentStatusEnum.length).toBe(6)
		})
	})

	describe('appointmentSchema (with transform)', () => {
		it('should transform patientId to BigInt', () => {
			const validInput = {
				patientId: '123',
				doctorId: '456',
				startTime: '2024-01-15T10:00:00',
				endTime: '2024-01-15T10:30:00',
				status: 'SCHEDULED' as const,
			}

			const result = appointmentSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.patientId).toBe(BigInt(123))
			}
		})

		it('should transform startTime and endTime to Date objects', () => {
			const validInput = {
				patientId: '123',
				doctorId: '456',
				startTime: '2024-01-15T10:00:00',
				endTime: '2024-01-15T10:30:00',
				status: 'SCHEDULED' as const,
			}

			const result = appointmentSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.startTime).toBeInstanceOf(Date)
				expect(result.data.endTime).toBeInstanceOf(Date)
			}
		})

		it('should apply Mexico timezone offset', () => {
			const validInput = {
				patientId: '123',
				doctorId: '456',
				startTime: '2024-01-15T10:00:00',
				endTime: '2024-01-15T10:30:00',
				status: 'SCHEDULED' as const,
			}

			const result = appointmentSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				const originalTime = new Date('2024-01-15T10:00:00')
				const transformedTime = result.data.startTime
				expect(transformedTime.getTime()).toBe(originalTime.getTime() + 6 * 60 * 60 * 1000)
			}
		})
	})

	describe('appointmentUpdateSchema', () => {
		it('should validate partial update input', () => {
			const validInput = {
				status: 'COMPLETED' as const,
			}

			const result = appointmentUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate with multiple partial fields', () => {
			const validInput = {
				status: 'CANCELLED' as const,
				notes: 'Cancelled due to patient request',
			}

			const result = appointmentUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should accept all fields optional', () => {
			const validInput = {}

			const result = appointmentUpdateSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject invalid status', () => {
			const invalidInput = {
				status: 'INVALID' as never,
			}

			const result = appointmentUpdateSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})

	describe('appointmentUpdateTransform', () => {
		it('should transform patientId to BigInt', () => {
			const input = { patientId: '123' }
			const result = appointmentUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.patientId).toBe(BigInt(123))
			}
		})

		it('should transform date strings to Date objects', () => {
			const input = {
				startTime: '2024-01-15T10:00:00',
				endTime: '2024-01-15T10:30:00',
			}
			const result = appointmentUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.startTime).toBeInstanceOf(Date)
				expect(result.data.endTime).toBeInstanceOf(Date)
			}
		})

		it('should omit undefined fields', () => {
			const input = {
				patientId: '123',
				doctorId: undefined,
			}
			const result = appointmentUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).not.toHaveProperty('doctorId')
			}
		})

		it('should include all provided fields', () => {
			const input = {
				status: 'COMPLETED',
				reason: 'Consulta completada',
				notes: 'Sin complicaciones',
			}
			const result = appointmentUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.status).toBe('COMPLETED')
				expect(result.data.reason).toBe('Consulta completada')
				expect(result.data.notes).toBe('Sin complicaciones')
			}
		})

		it('should handle undefined string fields correctly', () => {
			const input = {
				reason: undefined,
				notes: undefined,
			}
			const result = appointmentUpdateTransform.safeParse(input)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data).not.toHaveProperty('reason')
				expect(result.data).not.toHaveProperty('notes')
			}
		})
	})

	describe('appointmentFilterSchema', () => {
		it('should validate empty filter', () => {
			const validInput = {}

			const result = appointmentFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate filter with doctorId', () => {
			const validInput = {
				doctorId: '123',
			}

			const result = appointmentFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate filter with patientId', () => {
			const validInput = {
				patientId: '456',
			}

			const result = appointmentFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate filter with status', () => {
			const validInput = {
				status: 'SCHEDULED' as const,
			}

			const result = appointmentFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate filter with date range', () => {
			const validInput = {
				startDate: '2024-01-01',
				endDate: '2024-01-31',
			}

			const result = appointmentFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should validate filter with all fields', () => {
			const validInput = {
				doctorId: '123',
				patientId: '456',
				status: 'COMPLETED' as const,
				startDate: '2024-01-01',
				endDate: '2024-01-31',
			}

			const result = appointmentFilterSchema.safeParse(validInput)
			expect(result.success).toBe(true)
		})

		it('should reject invalid status in filter', () => {
			const invalidInput = {
				status: 'INVALID' as never,
			}

			const result = appointmentFilterSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})
})
