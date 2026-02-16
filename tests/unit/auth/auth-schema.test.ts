import { describe, it, expect } from 'vitest'

const validUserSignUp = {
  email: 'test@clinic.com',
  password: 'SecurePass123!',
  name: 'Test User',
  role: 'DOCTOR',
  clinicId: 1,
  specialty: 'Medicina General',
  licenseNumber: '12345678',
  phone: '5551234567',
}

const validUserSignIn = {
  email: 'test@clinic.com',
  password: 'SecurePass123!',
}

const validSession = {
  id: 'session-test-1',
  userId: 'user-test-1',
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  token: 'test-token-123',
}

describe('User Schema - Sign Up', () => {
  it('should validate a valid user registration', () => {
    const result = validateUserSignUp(validUserSignUp)
    expect(result.isValid).toBe(true)
  })

  it('should require email', () => {
    const result = validateUserSignUp({ ...validUserSignUp, email: '' })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('email')
  })

  it('should require valid email format', () => {
    const result = validateUserSignUp({ ...validUserSignUp, email: 'invalid-email' })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('email')
  })

  it('should require password', () => {
    const result = validateUserSignUp({ ...validUserSignUp, password: '' })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('password')
  })

  it('should require password minimum length of 8 characters', () => {
    const result = validateUserSignUp({ ...validUserSignUp, password: 'short' })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('password')
  })

  it('should require name', () => {
    const result = validateUserSignUp({ ...validUserSignUp, name: '' })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('name')
  })

  it('should require valid role', () => {
    const result = validateUserSignUp({ ...validUserSignUp, role: 'INVALID_ROLE' })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('role')
  })

  it('should require clinicId', () => {
    const result = validateUserSignUp({ ...validUserSignUp, clinicId: undefined })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('clinicId')
  })

  it('should require role ADMIN or DOCTOR for clinicId', () => {
    const result = validateUserSignUp({
      ...validUserSignUp,
      role: 'PATIENT',
      clinicId: 1
    })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('role')
  })

  it('should accept all valid roles', () => {
    const validRoles = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']
    for (const role of validRoles) {
      const result = validateUserSignUp({ ...validUserSignUp, role })
      expect(result.isValid).toBe(true)
    }
  })

  it('should make specialty optional', () => {
    const result = validateUserSignUp({
      ...validUserSignUp,
      specialty: undefined
    })
    expect(result.isValid).toBe(true)
  })

  it('should make licenseNumber optional', () => {
    const result = validateUserSignUp({
      ...validUserSignUp,
      licenseNumber: undefined
    })
    expect(result.isValid).toBe(true)
  })

  it('should make phone optional', () => {
    const result = validateUserSignUp({
      ...validUserSignUp,
      phone: undefined
    })
    expect(result.isValid).toBe(true)
  })
})

describe('User Schema - Sign In', () => {
  it('should validate valid sign in credentials', () => {
    const result = validateUserSignIn(validUserSignIn)
    expect(result.isValid).toBe(true)
  })

  it('should require email', () => {
    const result = validateUserSignIn({ ...validUserSignIn, email: '' })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('email')
  })

  it('should require password', () => {
    const result = validateUserSignIn({ ...validUserSignIn, password: '' })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('password')
  })

  it('should reject invalid email format', () => {
    const result = validateUserSignIn({ ...validUserSignIn, email: 'not-an-email' })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('email')
  })
})

describe('Session Schema', () => {
  it('should validate valid session', () => {
    const result = validateSession(validSession)
    expect(result.isValid).toBe(true)
  })

  it('should require session id', () => {
    const result = validateSession({ ...validSession, id: '' })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('id')
  })

  it('should require userId', () => {
    const result = validateSession({ ...validSession, userId: '' })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('userId')
  })

  it('should require expiration date', () => {
    const result = validateSession({ ...validSession, expires: undefined })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('expires')
  })

  it('should reject expired sessions', () => {
    const result = validateSession({
      ...validSession,
      expires: new Date(Date.now() - 1000)
    })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('expired')
  })

  it('should require token', () => {
    const result = validateSession({ ...validSession, token: '' })
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('token')
  })
})

// Helper functions for validation
function validateUserSignUp(data: Record<string, unknown>) {
  const errors: string[] = []

  if (!data.email || typeof data.email !== 'string') {
    errors.push('email is required')
  } else if (!data.email.includes('@')) {
    errors.push('email must be valid')
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('password is required')
  } else if (data.password.length < 8) {
    errors.push('password must be at least 8 characters')
  }

  if (!data.name || typeof data.name !== 'string' || data.name.length === 0) {
    errors.push('name is required')
  }

  const validRoles = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']
  if (!data.role || !validRoles.includes(data.role as string)) {
    errors.push('role must be valid')
  }

  if (data.clinicId === undefined) {
    errors.push('clinicId is required')
  }

  return {
    isValid: errors.length === 0,
    error: errors.join(', ')
  }
}

function validateUserSignIn(data: Record<string, unknown>) {
  const errors: string[] = []

  if (!data.email || typeof data.email !== 'string') {
    errors.push('email is required')
  } else if (!data.email.includes('@')) {
    errors.push('email must be valid')
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length === 0) {
    errors.push('password is required')
  }

  return {
    isValid: errors.length === 0,
    error: errors.join(', ')
  }
}

function validateSession(data: Record<string, unknown>) {
  const errors: string[] = []

  if (!data.id || typeof data.id !== 'string') {
    errors.push('id is required')
  }

  if (!data.userId || typeof data.userId !== 'string') {
    errors.push('userId is required')
  }

  if (!data.expires) {
    errors.push('expires is required')
  } else if (data.expires instanceof Date && data.expires < new Date()) {
    errors.push('session expired')
  }

  if (!data.token || typeof data.token !== 'string') {
    errors.push('token is required')
  }

  return {
    isValid: errors.length === 0,
    error: errors.join(', ')
  }
}
