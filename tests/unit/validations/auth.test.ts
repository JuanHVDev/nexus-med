import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '@/lib/validations/auth'

describe('auth validation - loginSchema', () => {
  const validLogin = {
    email: 'test@example.com',
    password: 'Password123',
  }

  it('should validate valid login data', () => {
    const result = loginSchema.safeParse(validLogin)
    expect(result.success).toBe(true)
  })

  it('should reject empty email', () => {
    const result = loginSchema.safeParse({ ...validLogin, email: '' })
    expect(result.success).toBe(false)
  })

  it('should reject invalid email format', () => {
    const result = loginSchema.safeParse({ ...validLogin, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({ ...validLogin, password: '' })
    expect(result.success).toBe(false)
  })

  it('should reject short password', () => {
    const result = loginSchema.safeParse({ ...validLogin, password: 'Pass12' })
    expect(result.success).toBe(false)
  })

  it('should reject missing fields', () => {
    const result = loginSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('auth validation - registerSchema', () => {
  const validRegister = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
    role: 'DOCTOR' as const,
    clinicId: '1',
    licenseNumber: '12345678',
    specialty: 'General Medicine',
    phone: '5551234567',
  }

  it('should validate valid registration data', () => {
    const result = registerSchema.safeParse(validRegister)
    expect(result.success).toBe(true)
  })

  it('should reject short name', () => {
    const result = registerSchema.safeParse({ ...validRegister, name: 'Jo' })
    expect(result.success).toBe(false)
  })

  it('should reject empty name', () => {
    const result = registerSchema.safeParse({ ...validRegister, name: '' })
    expect(result.success).toBe(false)
  })

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({ ...validRegister, email: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('should reject password without uppercase', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject password without lowercase', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: 'PASSWORD123',
      confirmPassword: 'PASSWORD123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject password without number', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: 'PasswordAa',
      confirmPassword: 'PasswordAa',
    })
    expect(result.success).toBe(false)
  })

  it('should reject mismatched passwords', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      confirmPassword: 'DifferentPass123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid role', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      role: 'ADMIN' as any,
    })
    expect(result.success).toBe(false)
  })

  it('should accept optional fields as undefined', () => {
    const minimal = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: 'DOCTOR' as const,
      clinicId: '1',
    }
    const result = registerSchema.safeParse(minimal)
    expect(result.success).toBe(true)
  })

  it('should accept all valid roles', () => {
    const roles = ['DOCTOR', 'NURSE', 'RECEPTIONIST'] as const
    for (const role of roles) {
      const result = registerSchema.safeParse({ ...validRegister, role })
      expect(result.success).toBe(true)
    }
  })
})
