import { describe, it, expect } from 'vitest'
import { cn, serializeBigInt } from '@/lib/utils'

describe('lib/utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('text-red-500', 'font-bold')
      expect(result).toContain('text-red-500')
      expect(result).toContain('font-bold')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle conflicting tailwind classes', () => {
      const result = cn('text-red-500', 'text-blue-500')
      expect(result).toContain('text-blue-500')
    })
  })

  describe('serializeBigInt', () => {
    it('should serialize bigint to string', () => {
      const obj = { id: BigInt(123), name: 'Test' }
      const result = serializeBigInt(obj)
      expect(result.id).toBe('123')
    })

    it('should handle nested objects', () => {
      const obj = { user: { id: BigInt(456) }, count: 10 }
      const result = serializeBigInt(obj)
      expect(result.user.id).toBe('456')
      expect(result.count).toBe(10)
    })

    it('should handle arrays', () => {
      const obj = { items: [BigInt(1), BigInt(2), BigInt(3)] }
      const result = serializeBigInt(obj)
      expect(result.items).toEqual(['1', '2', '3'])
    })

    it('should handle null and undefined', () => {
      const obj = { a: null, b: undefined, c: BigInt(0) }
      const result = serializeBigInt(obj)
      expect(result.a).toBeNull()
      expect(result.b).toBeUndefined()
      expect(result.c).toBe('0')
    })

    it('should handle primitive values', () => {
      expect(serializeBigInt(BigInt(123))).toBe('123')
      expect(serializeBigInt(456)).toBe(456)
      expect(serializeBigInt('hello')).toBe('hello')
    })
  })
})
