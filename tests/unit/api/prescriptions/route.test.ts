import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/prescriptions/route'
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
    prescription: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn()
    },
    patient: {
      findFirst: vi.fn()
    },
    medicalNote: {
      findFirst: vi.fn()
    }
  }
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const mockSession = {
  user: { id: 'user-1', role: 'DOCTOR', clinicId: BigInt(1) }
}

const mockPrescription = {
  id: BigInt(1),
  patientId: BigInt(1),
  doctorId: 'user-1',
  medicalNoteId: BigInt(1),
  medications: [{ name: 'Ibuprofen', dosage: '400mg', route: 'Oral', frequency: 'Every 8 hours' }],
  instructions: 'Take with food',
  issueDate: new Date('2024-01-15'),
  validUntil: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  patient: {
    id: BigInt(1),
    firstName: 'John',
    lastName: 'Doe',
    middleName: null,
    curp: 'ABCD123456EFGH78'
  },
  doctor: {
    id: 'user-1',
    name: 'Dr. Smith',
    specialty: 'General',
    licenseNumber: 'LIC123'
  }
}

describe('Prescriptions API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any)
    vi.mocked(headers).mockResolvedValue(new Map() as any)
  })

  describe('GET /api/prescriptions', () => {
    it('should return prescriptions for authenticated user', async () => {
      vi.mocked(prisma.prescription.findMany).mockResolvedValue([mockPrescription] as any)
      vi.mocked(prisma.prescription.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/prescriptions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(1)
      expect(data.pagination.total).toBe(1)
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/prescriptions')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should filter by patientId', async () => {
      vi.mocked(prisma.prescription.findMany).mockResolvedValue([mockPrescription] as any)
      vi.mocked(prisma.prescription.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/prescriptions?patientId=1')
      await GET(request)

      expect(prisma.prescription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ patientId: BigInt(1) })
        })
      )
    })

    it('should filter by doctorId', async () => {
      vi.mocked(prisma.prescription.findMany).mockResolvedValue([mockPrescription] as any)
      vi.mocked(prisma.prescription.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/prescriptions?doctorId=user-1')
      await GET(request)

      expect(prisma.prescription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ doctorId: 'user-1' })
        })
      )
    })

    it('should filter by search term', async () => {
      vi.mocked(prisma.prescription.findMany).mockResolvedValue([mockPrescription] as any)
      vi.mocked(prisma.prescription.count).mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/prescriptions?search=john')
      await GET(request)

      expect(prisma.prescription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { patient: { firstName: { contains: 'john', mode: 'insensitive' } } }
            ])
          })
        })
      )
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.prescription.findMany).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/prescriptions')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/prescriptions', () => {
    it('should create prescription successfully', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue({ id: BigInt(1) } as any)
      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue({ id: BigInt(1) } as any)
      vi.mocked(prisma.prescription.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.prescription.create).mockResolvedValue(mockPrescription as any)

      const request = new NextRequest('http://localhost/api/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          medicalNoteId: '1',
          medications: [{ name: 'Ibuprofen', dosage: '400mg', route: 'Oral', frequency: 'Every 8 hours' }],
          instructions: 'Take with food'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/prescriptions', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid input', async () => {
      const request = new NextRequest('http://localhost/api/prescriptions', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 404 when patient not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '999',
          medicalNoteId: '1',
          medications: [{ name: 'Ibuprofen', dosage: '400mg', route: 'Oral', frequency: 'Every 8 hours' }]
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should return 404 when medical note not found', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue({ id: BigInt(1) } as any)
      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          medicalNoteId: '999',
          medications: [{ name: 'Ibuprofen', dosage: '400mg', route: 'Oral', frequency: 'Every 8 hours' }]
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should return 400 when prescription already exists for note', async () => {
      vi.mocked(prisma.patient.findFirst).mockResolvedValue({ id: BigInt(1) } as any)
      vi.mocked(prisma.medicalNote.findFirst).mockResolvedValue({ id: BigInt(1) } as any)
      vi.mocked(prisma.prescription.findFirst).mockResolvedValue(mockPrescription as any)

      const request = new NextRequest('http://localhost/api/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          medicalNoteId: '1',
          medications: [{ name: 'Ibuprofen', dosage: '400mg', route: 'Oral', frequency: 'Every 8 hours' }]
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.patient.findFirst).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          patientId: '1',
          medicalNoteId: '1',
          medications: [{ name: 'Ibuprofen', dosage: '400mg', route: 'Oral', frequency: 'Every 8 hours' }]
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
