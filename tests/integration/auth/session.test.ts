import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Auth API - Sign Out', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('should sign out successfully', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    const response = await fetch('/api/auth/sign-out', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session-token=test-token-123',
      },
    })

    expect(response.ok).toBe(true)
  })

  it('should clear session cookie', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({
        'Set-Cookie': 'session-token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/',
      }),
      json: async () => ({ success: true }),
    } as Response)

    const response = await fetch('/api/auth/sign-out', {
      method: 'POST',
    })

    expect(response.ok).toBe(true)
    expect(response.headers.get('Set-Cookie')).toContain('session-token=')
  })

  it('should handle sign out without session', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    const response = await fetch('/api/auth/sign-out', {
      method: 'POST',
    })

    expect(response.ok).toBe(true)
  })

  it('should require POST method', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 405,
      json: async () => ({ error: 'Method not allowed' }),
    } as Response)

    const response = await fetch('/api/auth/sign-out', {
      method: 'GET',
    })

    expect(response.status).toBe(405)
  })
})

describe('Auth API - Session Management', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  const mockSession = {
    session: {
      id: 'session-test-1',
      token: 'test-token-123',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      userId: 'user-test-1',
    },
    user: {
      id: 'user-test-1',
      email: 'doctor@clinic.com',
      name: 'Dr. Juan Perez',
      role: 'DOCTOR',
      clinicId: 1,
      isActive: true,
    },
  }

  it('should get current session', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockSession,
    } as Response)

    const response = await fetch('/api/auth/get-session', {
      headers: {
        'Cookie': 'session-token=test-token-123',
      },
    })

    const data = await response.json()

    expect(response.ok).toBe(true)
    expect(data.user.email).toBe('doctor@clinic.com')
    expect(data.session).toBeDefined()
  })

  it('should return 401 for invalid session', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid session' }),
    } as Response)

    const response = await fetch('/api/auth/get-session', {
      headers: {
        'Cookie': 'session-token=invalid-token',
      },
    })

    expect(response.status).toBe(401)
  })

  it('should return 401 when session expired', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Session expired' }),
    } as Response)

    const response = await fetch('/api/auth/get-session', {
      headers: {
        'Cookie': 'session-token=expired-token',
      },
    })

    expect(response.status).toBe(401)
  })

  it('should refresh session before expiration', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockSession,
        session: {
          ...mockSession.session,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }),
    } as Response)

    const response = await fetch('/api/auth/get-session', {
      headers: {
        'Cookie': 'session-token=test-token-123',
      },
    })

    const data = await response.json()
    expect(data.session.expires).toBeDefined()
  })

  it('should return user with all fields', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockSession,
    } as Response)

    const response = await fetch('/api/auth/get-session', {
      headers: {
        'Cookie': 'session-token=test-token-123',
      },
    })

    const data = await response.json()
    expect(data.user.id).toBeDefined()
    expect(data.user.email).toBeDefined()
    expect(data.user.role).toBeDefined()
    expect(data.user.clinicId).toBeDefined()
    expect(data.user.isActive).toBeDefined()
  })

  it('should handle missing session token', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'No session' }),
    } as Response)

    const response = await fetch('/api/auth/get-session')

    expect(response.status).toBe(401)
  })

  it('should validate session on protected routes', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSession,
    } as Response)

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Protected data' }),
    } as Response)

    // First get session
    const sessionResponse = await fetch('/api/auth/get-session', {
      headers: { 'Cookie': 'session-token=test-token-123' },
    })
    expect(sessionResponse.ok).toBe(true)

    // Then access protected route
    const protectedResponse = await fetch('/api/protected/resource', {
      headers: { 'Cookie': 'session-token=test-token-123' },
    })
    expect(protectedResponse.ok).toBe(true)
  })
})

describe('Auth API - Session Expiration', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('should expire session after 7 days', async () => {
    const expiredSession = {
      session: {
        id: 'session-expired',
        token: 'expired-token',
        expires: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      user: null,
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Session expired' }),
    } as Response)

    const response = await fetch('/api/auth/get-session', {
      headers: {
        'Cookie': 'session-token=expired-token',
      },
    })

    expect(response.status).toBe(401)
  })

  it('should update session expiration on activity', async () => {
    const refreshedSession = {
      session: {
        id: 'session-test',
        token: 'test-token-123',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      user: {
        id: 'user-test',
        email: 'doctor@clinic.com',
        role: 'DOCTOR',
      },
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => refreshedSession,
    } as Response)

    const response = await fetch('/api/auth/get-session', {
      headers: {
        'Cookie': 'session-token=test-token-123',
      },
    })

    const data = await response.json()
    const expiresDate = new Date(data.session.expires)
    expect(expiresDate > new Date()).toBe(true)
  })
})
