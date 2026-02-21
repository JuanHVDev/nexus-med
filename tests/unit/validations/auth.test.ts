import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '@/lib/validations/auth'

describe('auth validation', () => {
	describe('loginSchema', () => {
		it('should validate a correct login input', () => {
			const validInput = {
				email: 'test@example.com',
				password: 'password123',
			}

			const result = loginSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.email).toBe('test@example.com')
				expect(result.data.password).toBe('password123')
			}
		})

		it('should reject invalid email format', () => {
			const invalidInput = {
				email: 'not-an-email',
				password: 'password123',
			}

			const result = loginSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('email')
			}
		})

		it('should reject empty email', () => {
			const invalidInput = {
				email: '',
				password: 'password123',
			}

			const result = loginSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject short password', () => {
			const invalidInput = {
				email: 'test@example.com',
				password: '123',
			}

			const result = loginSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('password')
			}
		})

		it('should reject missing email', () => {
			const invalidInput = {
				password: 'password123',
			}

			const result = loginSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing password', () => {
			const invalidInput = {
				email: 'test@example.com',
			}

			const result = loginSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})

	describe('registerSchema', () => {
		it('should validate a correct register input', () => {
			const validInput = {
				name: 'John Doe',
				email: 'test@example.com',
				password: 'Password1',
				confirmPassword: 'Password1',
			}

			const result = registerSchema.safeParse(validInput)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.name).toBe('John Doe')
				expect(result.data.email).toBe('test@example.com')
			}
		})

		it('should reject short name', () => {
			const invalidInput = {
				name: 'Jo',
				email: 'test@example.com',
				password: 'Password1',
				confirmPassword: 'Password1',
			}

			const result = registerSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('name')
			}
		})

		it('should reject invalid email format', () => {
			const invalidInput = {
				name: 'John Doe',
				email: 'not-an-email',
				password: 'Password1',
				confirmPassword: 'Password1',
			}

			const result = registerSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject password without uppercase', () => {
			const invalidInput = {
				name: 'John Doe',
				email: 'test@example.com',
				password: 'password1',
				confirmPassword: 'password1',
			}

			const result = registerSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
			if (!result.success) {
				const passwordIssue = result.error.issues.find(
					(issue) => issue.path[0] === 'password'
				)
				expect(passwordIssue).toBeDefined()
			}
		})

		it('should reject password without lowercase', () => {
			const invalidInput = {
				name: 'John Doe',
				email: 'test@example.com',
				password: 'PASSWORD1',
				confirmPassword: 'PASSWORD1',
			}

			const result = registerSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject password without number', () => {
			const invalidInput = {
				name: 'John Doe',
				email: 'test@example.com',
				password: 'Password',
				confirmPassword: 'Password',
			}

			const result = registerSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject short password', () => {
			const invalidInput = {
				name: 'John Doe',
				email: 'test@example.com',
				password: 'Pass1',
				confirmPassword: 'Pass1',
			}

			const result = registerSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject mismatched passwords', () => {
			const invalidInput = {
				name: 'John Doe',
				email: 'test@example.com',
				password: 'Password1',
				confirmPassword: 'Password2',
			}

			const result = registerSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
			if (!result.success) {
				const confirmPasswordIssue = result.error.issues.find(
					(issue) => issue.path[0] === 'confirmPassword'
				)
				expect(confirmPasswordIssue).toBeDefined()
			}
		})

		it('should reject missing confirmPassword', () => {
			const invalidInput = {
				name: 'John Doe',
				email: 'test@example.com',
				password: 'Password1',
			}

			const result = registerSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing name', () => {
			const invalidInput = {
				email: 'test@example.com',
				password: 'Password1',
				confirmPassword: 'Password1',
			}

			const result = registerSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})

		it('should reject missing email', () => {
			const invalidInput = {
				name: 'John Doe',
				password: 'Password1',
				confirmPassword: 'Password1',
			}

			const result = registerSchema.safeParse(invalidInput)
			expect(result.success).toBe(false)
		})
	})
})
