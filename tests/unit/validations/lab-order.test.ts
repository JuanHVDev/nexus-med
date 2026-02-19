/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import {
  labTestSchema,
  labOrderCreateSchema,
  labOrderUpdateSchema,
  labResultSchema,
  labResultCreateSchema,
} from '@/lib/validations/lab-order'

describe('lab-order validation - labTestSchema', () => {
  const validTest = {
    name: 'Biometría hemática',
    code: 'BH001',
    price: 250,
  }

  it('should validate valid lab test', () => {
    const result = labTestSchema.safeParse(validTest)
    expect(result.success).toBe(true)
  })

  it('should reject empty test name', () => {
    const result = labTestSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('should accept optional code and price', () => {
    const result = labTestSchema.safeParse({ name: 'Test' })
    expect(result.success).toBe(true)
  })
})

describe('lab-order validation - labOrderCreateSchema', () => {
  const validOrder = {
    patientId: '1',
    doctorId: 'doctor-1',
    medicalNoteId: '1',
    tests: [{ name: 'Biometría hemática', code: 'BH001', price: 250 }],
    instructions: 'En ayunas',
  }

  it('should validate valid lab order', () => {
    const result = labOrderCreateSchema.safeParse(validOrder)
    expect(result.success).toBe(true)
  })

  it('should reject empty patientId', () => {
    const result = labOrderCreateSchema.safeParse({ ...validOrder, patientId: '' })
    expect(result.success).toBe(false)
  })

  it('should reject empty doctorId', () => {
    const result = labOrderCreateSchema.safeParse({ ...validOrder, doctorId: '' })
    expect(result.success).toBe(false)
  })

  it('should reject empty tests array', () => {
    const result = labOrderCreateSchema.safeParse({ ...validOrder, tests: [] })
    expect(result.success).toBe(false)
  })

  it('should accept valid tests array', () => {
    const result = labOrderCreateSchema.safeParse({
      ...validOrder,
      tests: [{ name: 'Test 1' }, { name: 'Test 2' }],
    })
    expect(result.success).toBe(true)
  })

  it('should accept optional medicalNoteId', () => {
    const { medicalNoteId: _, ...withoutNote } = validOrder
    void _
    const result = labOrderCreateSchema.safeParse(withoutNote)
    expect(result.success).toBe(true)
  })

  it('should accept null instructions', () => {
    const result = labOrderCreateSchema.safeParse({ ...validOrder, instructions: null })
    expect(result.success).toBe(true)
  })
})

describe('lab-order validation - labOrderUpdateSchema', () => {
  it('should validate valid status update', () => {
    const result = labOrderUpdateSchema.safeParse({ status: 'COMPLETED' })
    expect(result.success).toBe(true)
  })

  it('should validate valid instructions update', () => {
    const result = labOrderUpdateSchema.safeParse({ instructions: 'Nuevas instrucciones' })
    expect(result.success).toBe(true)
  })

  it('should accept empty update', () => {
    const result = labOrderUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should reject invalid status', () => {
    const result = labOrderUpdateSchema.safeParse({ status: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('should accept all valid statuses', () => {
    const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    for (const status of statuses) {
      const result = labOrderUpdateSchema.safeParse({ status: status as any })
      expect(result.success).toBe(true)
    }
  })
})

describe('lab-order validation - labResultSchema', () => {
  const validResult = {
    testName: 'Glucosa',
    result: '95',
    unit: 'mg/dL',
    referenceRange: '70-100',
    flag: 'NORMAL' as const,
  }

  it('should validate valid lab result', () => {
    const result = labResultSchema.safeParse(validResult)
    expect(result.success).toBe(true)
  })

  it('should reject empty testName', () => {
    const result = labResultSchema.safeParse({ testName: '' })
    expect(result.success).toBe(false)
  })

  it('should accept optional fields', () => {
    const result = labResultSchema.safeParse({ testName: 'Test' })
    expect(result.success).toBe(true)
  })

  it('should accept all valid flags', () => {
    const flags = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL']
    for (const flag of flags) {
      const result = labResultSchema.safeParse({ ...validResult, flag })
      expect(result.success).toBe(true)
    }
  })

  it('should reject invalid flag', () => {
    const result = labResultSchema.safeParse({ ...validResult, flag: 'INVALID' })
    expect(result.success).toBe(false)
  })
})

describe('lab-order validation - labResultCreateSchema', () => {
  it('should validate valid results array', () => {
    const data = {
      results: [
        { testName: 'Test 1', result: '10' },
        { testName: 'Test 2', result: '20' },
      ],
    }
    const result = labResultCreateSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject empty results array', () => {
    const result = labResultCreateSchema.safeParse({ results: [] })
    expect(result.success).toBe(false)
  })
})
