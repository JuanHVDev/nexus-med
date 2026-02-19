/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/patients/route'
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
    patient: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn()
    }
  }
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers as nextHeaders } from 'next/headers'

const mockSession = {
  user: {
    id: 'user-1',
    role: 'ADMIN',
    clinicId: '1'
  }
}

describe('Patients API Route Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    (nextHeaders as ReturnType<typeof vi.fn>).mockResolvedValue(new Map())
  })

  describe('GET /api/patients', () => {
    it('should return patients list', async () => {
      const mockPatients = [
        {
          id: BigInt(1),
          clinicId: BigInt(1),
          firstName: 'Juan',
          lastName: 'Pérez',
          birthDate: new Date('1990-05-15'),
          gender: 'MALE' as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          medicalHistory: null
        }
      ]

      vi.mocked(prisma.patient.findMany).mockResolvedValue(mockPatients as any)
      vi.mocked(prisma.patient.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/patients')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.pagination.total).toBe(1)
    })

    it('should filter by search term', async () => {
      vi.mocked(prisma.patient.findMany).mockResolvedValue([])
      vi.mocked(prisma.patient.count).mockResolvedValue(0)

      const request = new NextRequest('http://localhost/api/patients?search=Juan')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(prisma.patient.findMany).toHaveBeenCalled()
    })

    it('should handle pagination params', async () => {
      vi.mocked(prisma.patient.findMany).mockResolvedValue([])
      vi.mocked(prisma.patient.count).mockResolvedValue(20)

      const request = new NextRequest('http://localhost/api/patients?page=2&limit=5')
      const response = await GET(request)
      const data = await response.json()

      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(5)
      expect(data.pagination.pages).toBe(4)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/patients')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/patients', () => {
    it('should create a new patient', async () => {
      const newPatient = {
        firstName: 'Nuevo',
        lastName: 'Paciente',
        birthDate: new Date('2000-01-01'),
        gender: 'MALE'
      }

      const createdPatient = {
        id: BigInt(1),
        clinicId: BigInt(1),
        ...newPatient,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.patient.create).mockResolvedValue(createdPatient as any)

      const request = new NextRequest('http://localhost/api/patients', {
        method: 'POST',
        body: JSON.stringify(newPatient)
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(prisma.patient.create).toHaveBeenCalled()
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/patients', {
        method: 'POST',
        body: JSON.stringify({})
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 for forbidden role', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', role: 'OTHER', clinicId: '1' }
      } as any)

      const request = new NextRequest('http://localhost/api/patients', {
        method: 'POST',
        body: JSON.stringify({ firstName: 'Test', lastName: 'Test', birthDate: '2000-01-01', gender: 'MALE' })
      })
      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('should check for duplicate CURP', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue({
        id: BigInt(1),
        curp: 'PEAJ900515HNLRRN01'
      } as any)

      const request = new NextRequest('http://localhost/api/patients', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Juan',
          lastName: 'Pérez',
          curp: 'PEAJ900515HNLRRN01',
          birthDate: '1990-05-15',
          gender: 'MALE'
        })
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
