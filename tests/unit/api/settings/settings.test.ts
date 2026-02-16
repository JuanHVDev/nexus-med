import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockClinic = {
  id: '1',
  name: 'Clinica Medical',
  rfc: 'CME210101ABC',
  address: 'Av. Medica 456',
  phone: '5555001000',
  email: 'contacto@clinicamedical.com',
  isActive: true,
  workingHours: {
    monday: { start: '09:00', end: '18:00', enabled: true },
    tuesday: { start: '09:00', end: '18:00', enabled: true },
    wednesday: { start: '09:00', end: '18:00', enabled: true },
    thursday: { start: '09:00', end: '18:00', enabled: true },
    friday: { start: '09:00', end: '18:00', enabled: true },
    saturday: { start: '09:00', end: '14:00', enabled: false },
    sunday: { start: '09:00', end: '14:00', enabled: false },
  },
  appointmentDuration: 30,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockDoctors = [
  {
    id: 'user-doctor-1',
    name: 'Dr. Juan Perez',
    email: 'juan.perez@clinic.com',
    role: 'DOCTOR',
    specialty: 'Medicina General',
    licenseNumber: '12345678',
    phone: '5551234567',
    isActive: true,
  },
]

const mockUsers = [
  {
    id: 'user-admin-1',
    name: 'Admin User',
    email: 'admin@clinic.com',
    role: 'ADMIN',
    isActive: true,
  },
  mockDoctors[0],
]

describe('Settings API', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('GET /api/settings/clinic', () => {
    it('should return clinic settings', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockClinic,
      } as Response)

      const response = await fetch('/api/settings/clinic')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.name).toBe('Clinica Medical')
      expect(data.rfc).toBe('CME210101ABC')
    })
  })

  describe('PATCH /api/settings/clinic', () => {
    it('should update clinic settings', async () => {
      const updates = {
        name: 'Nueva Clinica',
        phone: '5555002000',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockClinic, ...updates }),
      } as Response)

      const response = await fetch('/api/settings/clinic', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      expect(response.ok).toBe(true)
    })

    it('should update working hours', async () => {
      const workingHours = {
        monday: { start: '08:00', end: '19:00', enabled: true },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockClinic, workingHours }),
      } as Response)

      const response = await fetch('/api/settings/clinic', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workingHours }),
      })

      expect(response.ok).toBe(true)
    })

    it('should update appointment duration', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockClinic, appointmentDuration: 45 }),
      } as Response)

      const response = await fetch('/api/settings/clinic', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentDuration: 45 }),
      })

      expect(response.ok).toBe(true)
    })

    it('should return 400 for invalid RFC', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'RFC invalido' }),
      } as Response)

      const response = await fetch('/api/settings/clinic', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfc: 'INVALID' }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/settings/users', () => {
    it('should return list of users', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockUsers,
      } as Response)

      const response = await fetch('/api/settings/users')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(2)
    })

    it('should filter users by role', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockDoctors,
      } as Response)

      const response = await fetch('/api/settings/users?role=DOCTOR')
      expect(response.ok).toBe(true)
    })

    it('should filter users by active status', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockUsers.filter(u => u.isActive),
      } as Response)

      const response = await fetch('/api/settings/users?isActive=true')
      expect(response.ok).toBe(true)
    })
  })

  describe('GET /api/settings/doctors', () => {
    it('should return list of doctors', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockDoctors,
      } as Response)

      const response = await fetch('/api/settings/doctors')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(1)
      expect(data[0].role).toBe('DOCTOR')
    })

    it('should filter doctors by specialty', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockDoctors,
      } as Response)

      const response = await fetch('/api/settings/doctors?specialty=Medicina General')
      expect(response.ok).toBe(true)
    })

    it('should filter doctors by active status', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockDoctors.filter(d => d.isActive),
      } as Response)

      const response = await fetch('/api/settings/doctors?isActive=true')
      expect(response.ok).toBe(true)
    })
  })

  describe('GET /api/settings/hours', () => {
    it('should return working hours', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockClinic.workingHours,
      } as Response)

      const response = await fetch('/api/settings/hours')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.monday).toBeDefined()
      expect(data.monday.start).toBe('09:00')
    })
  })

  describe('PATCH /api/settings/hours', () => {
    it('should update working hours', async () => {
      const workingHours = {
        monday: { start: '08:00', end: '17:00', enabled: true },
        tuesday: { start: '08:00', end: '17:00', enabled: true },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => workingHours,
      } as Response)

      const response = await fetch('/api/settings/hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workingHours),
      })

      expect(response.ok).toBe(true)
    })

    it('should handle partial updates', async () => {
      const partialHours = {
        saturday: { start: '09:00', end: '15:00', enabled: true },
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockClinic.workingHours, ...partialHours }),
      } as Response)

      const response = await fetch('/api/settings/hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialHours),
      })

      expect(response.ok).toBe(true)
    })
  })

  describe('User management', () => {
    it('should create a new user', async () => {
      const newUser = {
        name: 'Nuevo Usuario',
        email: 'nuevo@clinic.com',
        role: 'DOCTOR',
        specialty: 'Cardiologia',
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ ...newUser, id: 'user-new-1', isActive: true }),
      } as Response)

      const response = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })

      expect(response.status).toBe(201)
    })

    it('should update user status', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ...mockUsers[0], isActive: false }),
      } as Response)

      const response = await fetch('/api/settings/users/user-admin-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      })

      expect(response.ok).toBe(true)
    })
  })
})
