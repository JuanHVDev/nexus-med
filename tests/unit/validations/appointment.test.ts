import { describe, it, expect } from 'vitest'
import { 
  appointmentSchema, 
  appointmentInputSchema, 
  appointmentUpdateSchema,
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
