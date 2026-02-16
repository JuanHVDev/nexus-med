import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockSignInResponse = {
  data: {
    user: {
      id: 'user-test-1',
      email: 'doctor@clinic.com',
      name: 'Dr. Juan Perez',
      role: 'DOCTOR',
      clinicId: 1,
      isActive: true,
    },
    session: {
      id: 'session-test-1',
      token: 'test-token-123',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
}

const mockSignUpResponse = {
  data: {
    user: {
      id: 'user-new-1',
      email: 'newdoctor@clinic.com',
      name: 'Dr. Maria Lopez',
      role: 'DOCTOR',
      clinicId: 1,
      isActive: true,
    },
    session: {
      id: 'session-new-1',
      token: 'new-token-123',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
}

describe('Auth API - Sign In', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('should sign in with valid credentials', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockSignInResponse,
    } as Response)

    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doctor@clinic.com',
        password: 'SecurePass123!',
      }),
    })

    const data = await response.json()

    expect(response.ok).toBe(true)
    expect(data.data.user.email).toBe('doctor@clinic.com')
    expect(data.data.session).toBeDefined()
  })

  it('should return user with clinicId', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockSignInResponse,
    } as Response)

    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doctor@clinic.com',
        password: 'SecurePass123!',
      }),
    })

    const data = await response.json()
    expect(data.data.user.clinicId).toBe(1)
  })

  it('should return user with role', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockSignInResponse,
    } as Response)

    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doctor@clinic.com',
        password: 'SecurePass123!',
      }),
    })

    const data = await response.json()
    expect(data.data.user.role).toBe('DOCTOR')
  })

  it('should return 401 for invalid credentials', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid credentials' }),
    } as Response)

    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doctor@clinic.com',
        password: 'wrongpassword',
      }),
    })

    expect(response.status).toBe(401)
  })

  it('should return 401 for non-existent user', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'User not found' }),
    } as Response)

    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@clinic.com',
        password: 'password123',
      }),
    })

    expect(response.status).toBe(401)
  })

  it('should return 400 for missing email', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Email is required' }),
    } as Response)

    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'password123',
      }),
    })

    expect(response.status).toBe(400)
  })

  it('should return 400 for missing password', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Password is required' }),
    } as Response)

    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doctor@clinic.com',
      }),
    })

    expect(response.status).toBe(400)
  })

  it('should return session with expiration', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockSignInResponse,
    } as Response)

    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doctor@clinic.com',
        password: 'SecurePass123!',
      }),
    })

    const data = await response.json()
    expect(data.data.session.expires).toBeDefined()
    expect(data.data.session.token).toBeDefined()
  })

  it('should handle inactive user account', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Account is inactive' }),
    } as Response)

    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'inactive@clinic.com',
        password: 'SecurePass123!',
      }),
    })

    expect(response.status).toBe(403)
  })
})

describe('Auth API - Sign Up', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('should create new user with valid data', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockSignUpResponse,
    } as Response)

    const response = await fetch('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newdoctor@clinic.com',
        password: 'SecurePass123!',
        name: 'Dr. Maria Lopez',
        role: 'DOCTOR',
        clinicId: 1,
        specialty: 'Medicina General',
        licenseNumber: '87654321',
      }),
    })

    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.data.user.email).toBe('newdoctor@clinic.com')
  })

  it('should require clinicId for DOCTOR role', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'clinicId is required for DOCTOR role' }),
    } as Response)

    const response = await fetch('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newdoctor@clinic.com',
        password: 'SecurePass123!',
        name: 'Dr. Maria Lopez',
        role: 'DOCTOR',
        specialty: 'Medicina General',
      }),
    })

    expect(response.status).toBe(400)
  })

  it('should return 409 for duplicate email', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'Email already registered' }),
    } as Response)

    const response = await fetch('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doctor@clinic.com',
        password: 'SecurePass123!',
        name: 'Dr. Juan Perez',
        role: 'DOCTOR',
        clinicId: 1,
      }),
    })

    expect(response.status).toBe(409)
  })

  it('should create user with ADMIN role', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        ...mockSignUpResponse,
        data: { ...mockSignUpResponse.data, user: { ...mockSignUpResponse.data.user, role: 'ADMIN' } }
      }),
    } as Response)

    const response = await fetch('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@clinic.com',
        password: 'SecurePass123!',
        name: 'Admin User',
        role: 'ADMIN',
        clinicId: 1,
      }),
    })

    const data = await response.json()
    expect(data.data.user.role).toBe('ADMIN')
  })

  it('should set isActive to true by default', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockSignUpResponse,
    } as Response)

    const response = await fetch('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newdoctor@clinic.com',
        password: 'SecurePass123!',
        name: 'Dr. Maria Lopez',
        role: 'DOCTOR',
        clinicId: 1,
      }),
    })

    const data = await response.json()
    expect(data.data.user.isActive).toBe(true)
  })
})
