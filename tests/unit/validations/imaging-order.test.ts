/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import {
  imagingOrderCreateSchema,
  imagingOrderUpdateSchema,
  STUDY_TYPES,
} from '@/lib/validations/imaging-order'

describe('imaging-order validation - imagingOrderCreateSchema', () => {
  const validOrder = {
    patientId: '1',
    doctorId: 'doctor-1',
    medicalNoteId: '1',
    studyType: 'RX',
    bodyPart: 'Tórax',
    reason: 'Dolor torácico',
    clinicalNotes: 'Paciente con dolor agudo',
  }

  it('should validate valid imaging order', () => {
    const result = imagingOrderCreateSchema.safeParse(validOrder)
    expect(result.success).toBe(true)
  })

  it('should reject empty patientId', () => {
    const result = imagingOrderCreateSchema.safeParse({ ...validOrder, patientId: '' })
    expect(result.success).toBe(false)
  })

  it('should reject empty doctorId', () => {
    const result = imagingOrderCreateSchema.safeParse({ ...validOrder, doctorId: '' })
    expect(result.success).toBe(false)
  })

  it('should reject empty studyType', () => {
    const result = imagingOrderCreateSchema.safeParse({ ...validOrder, studyType: '' })
    expect(result.success).toBe(false)
  })

  it('should reject empty bodyPart', () => {
    const result = imagingOrderCreateSchema.safeParse({ ...validOrder, bodyPart: '' })
    expect(result.success).toBe(false)
  })

  it('should accept optional medicalNoteId', () => {
    const { medicalNoteId: _, ...withoutNote } = validOrder
    void _
    const result = imagingOrderCreateSchema.safeParse(withoutNote)
    expect(result.success).toBe(true)
  })

  it('should accept null reason', () => {
    const result = imagingOrderCreateSchema.safeParse({ ...validOrder, reason: null })
    expect(result.success).toBe(true)
  })

  it('should accept null clinicalNotes', () => {
    const result = imagingOrderCreateSchema.safeParse({ ...validOrder, clinicalNotes: null })
    expect(result.success).toBe(true)
  })

  it('should accept all valid study types', () => {
    for (const type of STUDY_TYPES) {
      const result = imagingOrderCreateSchema.safeParse({ ...validOrder, studyType: type.value })
      expect(result.success).toBe(true)
    }
  })
})

describe('imaging-order validation - imagingOrderUpdateSchema', () => {
  it('should validate valid status update', () => {
    const result = imagingOrderUpdateSchema.safeParse({ status: 'COMPLETED' })
    expect(result.success).toBe(true)
  })

  it('should validate valid reportUrl update', () => {
    const result = imagingOrderUpdateSchema.safeParse({
      reportUrl: 'https://storage.example.com/report.pdf',
    })
    expect(result.success).toBe(true)
  })

  it('should validate findings update', () => {
    const result = imagingOrderUpdateSchema.safeParse({
      findings: 'Se observa consolidación en lóbulo inferior derecho',
    })
    expect(result.success).toBe(true)
  })

  it('should validate impression update', () => {
    const result = imagingOrderUpdateSchema.safeParse({
      impression: 'Neumonía adquirida en la comunidad',
    })
    expect(result.success).toBe(true)
  })

  it('should accept empty update', () => {
    const result = imagingOrderUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should reject invalid status', () => {
    const result = imagingOrderUpdateSchema.safeParse({ status: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('should accept all valid statuses', () => {
    const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    for (const status of statuses) {
      const result = imagingOrderUpdateSchema.safeParse({ status: status as any })
      expect(result.success).toBe(true)
    }
  })

  it('should allow multiple field updates', () => {
    const result = imagingOrderUpdateSchema.safeParse({
      status: 'COMPLETED',
      findings: 'Hallazgos normales',
      impression: 'Sin alteraciones significativas',
    })
    expect(result.success).toBe(true)
  })
})

describe('STUDY_TYPES constant', () => {
  it('should have at least 5 study types', () => {
    expect(STUDY_TYPES.length).toBeGreaterThanOrEqual(5)
  })

  it('should have valid structure for each type', () => {
    for (const type of STUDY_TYPES) {
      expect(type).toHaveProperty('value')
      expect(type).toHaveProperty('label')
      expect(typeof type.value).toBe('string')
      expect(typeof type.label).toBe('string')
    }
  })

  it('should include common study types', () => {
    const values = STUDY_TYPES.map((t) => t.value)
    expect(values).toContain('RX')
    expect(values).toContain('USG')
  })
})
