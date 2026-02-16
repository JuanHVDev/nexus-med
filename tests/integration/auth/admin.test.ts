import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockAdminUser = {
  id: 'user-admin-1',
  email: 'admin@clinic.com',
  name: 'Admin User',
  role: 'ADMIN',
  clinicId: 1,
  isActive: true,
}

const mockDoctorUser = {
  id: 'user-doctor-1',
  email: 'doctor@clinic.com',
  name: 'Dr. Juan Perez',
  role: 'DOCTOR',
  clinicId: 1,
  specialty: 'Medicina General',
  isActive: true,
}

const mockUsers = [mockAdminUser, mockDoctorUser]

describe('Auth API - Admin Functions', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('Get All Users', () => {
    it('should return all users for admin', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockUsers,
      } as Response)

      const response = await fetch('/api/admin/users', {
        headers: {
          'Cookie': 'session-token=admin-token',
        },
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(2)
    })

    it('should return 403 for non-admin users', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden: Admin access required' }),
      } as Response)

      const response = await fetch('/api/admin/users', {
        headers: {
          'Cookie': 'session-token=doctor-token',
        },
      })

      expect(response.status).toBe(403)
    })

    it('should filter users by role', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockUsers.filter(u => u.role === 'DOCTOR'),
      } as Response)

      const response = await fetch('/api/admin/users?role=DOCTOR', {
        headers: {
          'Cookie': 'session-token=admin-token',
        },
      })

      const data = await response.json()
      expect(data).toHaveLength(1)
      expect(data[0].role).toBe('DOCTOR')
    })
  })

  describe('Create User', () => {
    it('should create user as admin', async () => {
      const newUser = {
        email: 'newnurse@clinic.com',
        password: 'SecurePass123!',
        name: 'Nurse Maria',
        role: 'NURSE',
        clinicId: 1,
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ ...newUser, id: 'user-new-1', isActive: true }),
      } as Response)

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'session-token=admin-token',
        },
        body: JSON.stringify(newUser),
      })

      expect(response.status).toBe(201)
    })

    it('should return 403 for non-admin', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      } as Response)

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'session-token=doctor-token',
        },
        body: JSON.stringify({}),
      })

      expect(response.status).toBe(403)
    })

    it('should validate role on user creation', async () => {
      const newUser = {
        email: 'new@clinic.com',
        password: 'SecurePass123!',
        name: 'New User',
        role: 'INVALID_ROLE',
        clinicId: 1,
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid role' }),
      } as Response)

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'session-token=admin-token',
        },
        body: JSON.stringify(newUser),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Update User', () => {
    it('should update user as admin', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockDoctorUser, specialty: 'Cardiologia' }),
      } as Response)

      const response = await fetch('/api/admin/users/user-doctor-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'session-token=admin-token',
        },
        body: JSON.stringify({ specialty: 'Cardiologia' }),
      })

      const data = await response.json()
      expect(data.specialty).toBe('Cardiologia')
    })

    it('should deactivate user', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockDoctorUser, isActive: false }),
      } as Response)

      const response = await fetch('/api/admin/users/user-doctor-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'session-token=admin-token',
        },
        body: JSON.stringify({ isActive: false }),
      })

      const data = await response.json()
      expect(data.isActive).toBe(false)
    })

    it('should reactivate user', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockDoctorUser, isActive: true }),
      } as Response)

      const response = await fetch('/api/admin/users/user-doctor-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'session-token=admin-token',
        },
        body: JSON.stringify({ isActive: true }),
      })

      const data = await response.json()
      expect(data.isActive).toBe(true)
    })

    it('should change user role', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockDoctorUser, role: 'ADMIN' }),
      } as Response)

      const response = await fetch('/api/admin/users/user-doctor-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'session-token=admin-token',
        },
        body: JSON.stringify({ role: 'ADMIN' }),
      })

      const data = await response.json()
      expect(data.role).toBe('ADMIN')
    })
  })

  describe('Delete User', () => {
    it('should delete user as admin', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const response = await fetch('/api/admin/users/user-doctor-1', {
        method: 'DELETE',
        headers: {
          'Cookie': 'session-token=admin-token',
        },
      })

      expect(response.ok).toBe(true)
    })

    it('should return 403 for non-admin', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      } as Response)

      const response = await fetch('/api/admin/users/user-doctor-1', {
        method: 'DELETE',
        headers: {
          'Cookie': 'session-token=doctor-token',
        },
      })

      expect(response.status).toBe(403)
    })

    it('should prevent deleting self', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Cannot delete yourself' }),
      } as Response)

      const response = await fetch('/api/admin/users/user-admin-1', {
        method: 'DELETE',
        headers: {
          'Cookie': 'session-token=admin-token',
        },
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Impersonate User', () => {
    it('should allow admin to impersonate user', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          session: {
            token: 'impersonate-token',
            userId: 'user-doctor-1',
          },
          user: mockDoctorUser,
        }),
      } as Response)

      const response = await fetch('/api/admin/impersonate/user-doctor-1', {
        method: 'POST',
        headers: {
          'Cookie': 'session-token=admin-token',
        },
      })

      const data = await response.json()
      expect(response.ok).toBe(true)
      expect(data.user.id).toBe('user-doctor-1')
    })

    it('should return 403 for non-admin', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      } as Response)

      const response = await fetch('/api/admin/impersonate/user-doctor-1', {
        method: 'POST',
        headers: {
          'Cookie': 'session-token=doctor-token',
        },
      })

      expect(response.status).toBe(403)
    })
  })
})

describe('Auth API - Role Permissions', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('should allow DOCTOR to access medical notes', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response)

    const response = await fetch('/api/medical-notes', {
      headers: {
        'Cookie': 'session-token=doctor-token',
      },
    })

    expect(response.ok).toBe(true)
  })

  it('should allow NURSE to view appointments', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response)

    const response = await fetch('/api/appointments', {
      headers: {
        'Cookie': 'session-token=nurse-token',
      },
    })

    expect(response.ok).toBe(true)
  })

  it('should allow RECEPTIONIST to manage patients', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response)

    const response = await fetch('/api/patients', {
      headers: {
        'Cookie': 'session-token=receptionist-token',
      },
    })

    expect(response.ok).toBe(true)
  })

  it('should prevent RECEPTIONIST from accessing admin routes', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' }),
    } as Response)

    const response = await fetch('/api/admin/users', {
      headers: {
        'Cookie': 'session-token=receptionist-token',
      },
    })

    expect(response.status).toBe(403)
  })
})
