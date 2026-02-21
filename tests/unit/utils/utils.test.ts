import { describe, it, expect } from 'vitest'
import { cn, serializeBigInt, calculateAge } from '@/lib/utils'

describe('utils', () => {
	describe('cn', () => {
		it('should merge class names', () => {
			const result = cn('foo', 'bar')
			expect(result).toBe('foo bar')
		})

		it('should handle conditional classes', () => {
			const result = cn('foo', false && 'bar', 'baz')
			expect(result).toBe('foo baz')
		})

		it('should handle array inputs', () => {
			const result = cn(['foo', 'bar'], 'baz')
			expect(result).toBe('foo bar baz')
		})

		it('should handle object inputs', () => {
			const result = cn({ foo: true, bar: false, baz: true })
			expect(result).toBe('foo baz')
		})

		it('should handle empty inputs', () => {
			const result = cn()
			expect(result).toBe('')
		})

		it('should handle mixed inputs', () => {
			const result = cn('foo', { bar: true, baz: false }, ['qux', 'quux'])
			expect(result).toBe('foo bar qux quux')
		})
	})

	describe('serializeBigInt', () => {
		it('should serialize an object with BigInt', () => {
			const obj = {
				id: BigInt(123),
				name: 'test',
			}

			const result = serializeBigInt(obj)
			expect(result).toEqual({
				id: '123',
				name: 'test',
			})
		})

		it('should serialize an array with BigInt', () => {
			const arr = [
				{ id: BigInt(1), name: 'a' },
				{ id: BigInt(2), name: 'b' },
			]

			const result = serializeBigInt(arr)
			expect(result).toEqual([
				{ id: '1', name: 'a' },
				{ id: '2', name: 'b' },
			])
		})

		it('should handle nested objects', () => {
			const obj = {
				user: {
					id: BigInt(1),
					profile: {
						bigId: BigInt(99),
					},
				},
			}

			const result = serializeBigInt(obj)
			expect(result).toEqual({
				user: {
					id: '1',
					profile: {
						bigId: '99',
					},
				},
			})
		})

		it('should handle primitive values', () => {
			expect(serializeBigInt('string')).toBe('string')
			expect(serializeBigInt(42)).toBe(42)
			expect(serializeBigInt(true)).toBe(true)
			expect(serializeBigInt(null)).toBe(null)
		})

		it('should handle array of primitives', () => {
			const arr = [BigInt(1), BigInt(2), BigInt(3)]
			const result = serializeBigInt(arr)
			expect(result).toEqual(['1', '2', '3'])
		})

		it('should handle empty object', () => {
			const result = serializeBigInt({})
			expect(result).toEqual({})
		})

		it('should handle empty array', () => {
			const result = serializeBigInt([])
			expect(result).toEqual([])
		})
	})

	describe('calculateAge', () => {
		it('should calculate age correctly for past birthdays', () => {
			const birthDate = new Date('2000-01-15')
			const age = calculateAge(birthDate)
			expect(age).toBeGreaterThanOrEqual(25)
		})

		it('should calculate age from string date', () => {
			const age = calculateAge('2000-06-15')
			expect(age).toBeGreaterThanOrEqual(25)
		})

		it('should return 0 for newborn', () => {
			const today = new Date()
			const birthDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
			const age = calculateAge(birthDate)
			expect(age).toBe(0)
		})

		it('should account for birthday not yet passed this year', () => {
			const today = new Date()
			const birthDate = new Date(
				today.getFullYear() - 20,
				today.getMonth() + 1,
				today.getDate()
			)
			const age = calculateAge(birthDate)
			expect(age).toBe(19)
		})

		it('should account for birthday already passed this year', () => {
			const today = new Date()
			const birthDate = new Date(
				today.getFullYear() - 20,
				today.getMonth() - 1,
				today.getDate()
			)
			const age = calculateAge(birthDate)
			expect(age).toBe(20)
		})

		it('should handle very old dates', () => {
			const birthDate = new Date('1950-01-01')
			const age = calculateAge(birthDate)
			expect(age).toBeGreaterThan(70)
		})
	})
})
