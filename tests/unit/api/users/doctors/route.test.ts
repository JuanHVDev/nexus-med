import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/users/doctors/route'
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
      findMany: vi.fn()
    }
  }
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const mockSession = {
  user: { id: 'user-1', role: 'ADMIN', clinicId: BigInt(1) }
}

const mockDoctor = {
  id: 'doctor-1',
  name: 'Dr. Smith',
  email: 'smith@test.com',
  specialty: 'General',
  licenseNumber: 'LIC123'
}

describe('Users Doctors API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/users/doctors', () => {
    it('should return doctors for authenticated user', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockDoctor] as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].id).toBe('doctor-1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('should only return active doctors', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockDoctor] as any)

      await GET()

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true
          })
        })
      )
    })

    it('should only return users with DOCTOR role', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockDoctor] as any)

      await GET()

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: 'DOCTOR'
          })
        })
      )
    })

    it('should order by name', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockDoctor] as any)

      await GET()

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' }
        })
      )
    })

    it('should include required fields', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockDoctor] as any)

      await GET()

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            name: true,
            email: true,
            specialty: true,
            licenseNumber: true
          }
        })
      )
    })
  })
})
