import { describe, it, expect } from 'vitest'
import { 
  appointmentSchema, 
  appointmentInputSchema, 
  appointmentUpdateSchema,
  appointmentUpdateTransform,
  appointmentFilterSchema,
  appointmentStatusEnum
} from '@/lib/validations/appointment'

const validAppointment = {
  patientId: '1',
  doctorId: 'user-doctor-1',
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
  status: 'SCHEDULED' as const,
  reason: 'Consulta general',
  notes: 'Primera vez',
}

describe('appointmentSchema', () => {
  it('should validate a valid appointment', () => {
    const result = appointmentSchema.safeParse(validAppointment)
    expect(result.success).toBe(true)
  })

  it('should reject empty patientId', () => {
    const result = appointmentSchema.safeParse({ ...validAppointment, patientId: '' })
    expect(result.success).toBe(false)
  })

  it('should reject empty doctorId', () => {
    const result = appointmentSchema.safeParse({ ...validAppointment, doctorId: '' })
    expect(result.success).toBe(false)
  })

  it('should reject empty startTime', () => {
    const result = appointmentSchema.safeParse({ ...validAppointment, startTime: '' })
    expect(result.success).toBe(false)
  })

  it('should reject empty endTime', () => {
    const result = appointmentSchema.safeParse({ ...validAppointment, endTime: '' })
    expect(result.success).toBe(false)
  })

  it('should reject invalid status enum', () => {
    const result = appointmentSchema.safeParse({ ...validAppointment, status: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('should accept all valid status values', () => {
    for (const status of appointmentStatusEnum) {
      const result = appointmentSchema.safeParse({ ...validAppointment, status })
      expect(result.success).toBe(true)
    }
  })

  it('should transform string dates to Date objects', () => {
    const result = appointmentSchema.safeParse(validAppointment)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.startTime).toBeInstanceOf(Date)
      expect(result.data.endTime).toBeInstanceOf(Date)
    }
  })
})

describe('appointmentInputSchema', () => {
  it('should validate without transformation', () => {
    const result = appointmentInputSchema.safeParse(validAppointment)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.startTime).toBe('string')
    }
  })
})

describe('appointmentUpdateSchema', () => {
  it('should allow partial updates', () => {
    const result = appointmentUpdateSchema.safeParse({ status: 'COMPLETED' })
    expect(result.success).toBe(true)
  })

  it('should allow multiple partial updates', () => {
    const result = appointmentUpdateSchema.safeParse({
      status: 'CANCELLED',
      notes: 'Paciente no se presentó',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid status in update', () => {
    const result = appointmentUpdateSchema.safeParse({ status: 'INVALID' })
    expect(result.success).toBe(false)
  })
})

describe('appointmentFilterSchema', () => {
  it('should validate empty filter', () => {
    const result = appointmentFilterSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should validate doctorId filter', () => {
    const result = appointmentFilterSchema.safeParse({ doctorId: 'user-123' })
    expect(result.success).toBe(true)
  })

  it('should validate patientId filter', () => {
    const result = appointmentFilterSchema.safeParse({ patientId: '1' })
    expect(result.success).toBe(true)
  })

  it('should validate status filter', () => {
    const result = appointmentFilterSchema.safeParse({ status: 'SCHEDULED' })
    expect(result.success).toBe(true)
  })

  it('should validate date range filter', () => {
    const result = appointmentFilterSchema.safeParse({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid status in filter', () => {
    const result = appointmentFilterSchema.safeParse({ status: 'INVALID' })
    expect(result.success).toBe(false)
  })
})

describe('appointmentUpdateTransform', () => {
  it('should transform patientId to BigInt', () => {
    const result = appointmentUpdateTransform.safeParse({ patientId: '123' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.patientId).toBe(BigInt(123))
      expect(typeof result.data.patientId).toBe('bigint')
    }
  })

  it('should transform doctorId as string', () => {
    const result = appointmentUpdateTransform.safeParse({ doctorId: 'user-doctor-1' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.doctorId).toBe('user-doctor-1')
    }
  })

  it('should transform startTime to Date', () => {
    const isoString = '2024-06-15T10:00:00.000Z'
    const result = appointmentUpdateTransform.safeParse({ startTime: isoString })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.startTime).toBeInstanceOf(Date)
      expect((result.data.startTime as Date).toISOString()).toBe(isoString)
    }
  })

  it('should transform endTime to Date', () => {
    const isoString = '2024-06-15T11:00:00.000Z'
    const result = appointmentUpdateTransform.safeParse({ endTime: isoString })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.endTime).toBeInstanceOf(Date)
      expect((result.data.endTime as Date).toISOString()).toBe(isoString)
    }
  })

  it('should transform each status value', () => {
    for (const status of appointmentStatusEnum) {
      const result = appointmentUpdateTransform.safeParse({ status })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe(status)
      }
    }
  })

  it('should accept empty string for reason', () => {
    const result = appointmentUpdateTransform.safeParse({ reason: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.reason).toBe('')
    }
  })

  it('should accept empty string for notes', () => {
    const result = appointmentUpdateTransform.safeParse({ notes: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBe('')
    }
  })

  it('should transform all fields populated', () => {
    const input = {
      patientId: '999',
      doctorId: 'doctor-123',
      startTime: '2024-06-15T10:00:00.000Z',
      endTime: '2024-06-15T11:00:00.000Z',
      status: 'CONFIRMED' as const,
      reason: 'Follow-up appointment',
      notes: 'Patient arrived early',
    }
    const result = appointmentUpdateTransform.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.patientId).toBe(BigInt(999))
      expect(result.data.doctorId).toBe('doctor-123')
      expect(result.data.startTime).toBeInstanceOf(Date)
      expect(result.data.endTime).toBeInstanceOf(Date)
      expect(result.data.status).toBe('CONFIRMED')
      expect(result.data.reason).toBe('Follow-up appointment')
      expect(result.data.notes).toBe('Patient arrived early')
    }
  })

  it('should transform empty object to empty result', () => {
    const result = appointmentUpdateTransform.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({})
    }
  })
})
