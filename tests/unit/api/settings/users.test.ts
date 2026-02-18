import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/settings/users/route'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Map())
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn()
    }
  }
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}))

vi.mock('@/lib/utils', () => ({
  serializeBigInt: vi.fn((obj) => JSON.parse(JSON.stringify(obj, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  )))
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const mockSession = {
  user: { id: 'user-1', role: 'ADMIN', clinicId: BigInt(1) }
}

describe('Settings Users API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/settings/users', () => {
    it('should return users for authenticated user', async () => {
      const mockUsers = [{
        id: 'user-1',
        name: 'Admin User',
        email: 'admin@clinic.com',
        role: 'ADMIN',
        specialty: null,
        licenseNumber: null,
        phone: '1234567890',
        isActive: true,
        createdAt: new Date()
      }]

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users).toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('should return 404 when user has no clinicId', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN', clinicId: null }
      } as any)

      const response = await GET()

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/settings/users', () => {
    it('should create a new user', async () => {
      const mockUser = {
        id: 'user-new',
        name: 'New User',
        email: 'new@clinic.com',
        role: 'DOCTOR',
        specialty: 'Cardiology',
        licenseNumber: '12345',
        phone: '1234567890',
        isActive: true,
        createdAt: new Date()
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any)

      const request = new NextRequest('http://localhost/api/settings/users', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New User',
          email: 'new@clinic.com',
          password: 'password123',
          role: 'DOCTOR',
          specialty: 'Cardiology',
          licenseNumber: '12345'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/settings/users', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', email: 'test@clinic.com', password: '123456', role: 'DOCTOR' })
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 for non-admin users', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'DOCTOR', clinicId: BigInt(1) }
      } as any)

      const request = new NextRequest('http://localhost/api/settings/users', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', email: 'test@clinic.com', password: '123456', role: 'DOCTOR' })
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost/api/settings/users', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 when email already exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: 'existing@clinic.com'
      })

      const request = new NextRequest('http://localhost/api/settings/users', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          email: 'existing@clinic.com',
          password: '123456',
          role: 'DOCTOR'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/settings/users', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          email: 'test@clinic.com',
          password: '123456',
          role: 'DOCTOR'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
