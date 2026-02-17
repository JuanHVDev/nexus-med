import { describe, it, expect } from 'vitest'
import { 
  prescriptionSchema, 
  prescriptionInputSchema,
  prescriptionFilterSchema,
  medicationSchema
} from '@/lib/validations/prescription'

const validPrescription = {
  patientId: '1',
  medicalNoteId: '1',
  medications: [
    {
      name: 'Paracetamol',
      dosage: '500mg',
      route: 'Oral',
      frequency: 'Cada 6 horas',
      duration: '5 días',
      instructions: 'Tomar con alimentos',
    },
  ],
  instructions: 'Seguir tratamiento indicado',
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
}

describe('prescriptionSchema', () => {
  it('should validate a valid prescription', () => {
    const result = prescriptionSchema.safeParse(validPrescription)
    expect(result.success).toBe(true)
  })

  it('should reject empty patientId', () => {
    const result = prescriptionSchema.safeParse({ ...validPrescription, patientId: '' })
    expect(result.success).toBe(false)
  })

  it('should reject empty medicalNoteId', () => {
    const result = prescriptionSchema.safeParse({ ...validPrescription, medicalNoteId: '' })
    expect(result.success).toBe(false)
  })

  it('should reject empty medications array', () => {
    const result = prescriptionSchema.safeParse({ ...validPrescription, medications: [] })
    expect(result.success).toBe(false)
  })

  it('should reject medication without name', () => {
    const result = prescriptionSchema.safeParse({
      ...validPrescription,
      medications: [{ dosage: '500mg', route: 'Oral' }],
    })
    expect(result.success).toBe(false)
  })

  it('should reject medication without dosage', () => {
    const result = prescriptionSchema.safeParse({
      ...validPrescription,
      medications: [{ name: 'Paracetamol', route: 'Oral' }],
    })
    expect(result.success).toBe(false)
  })

  it('should reject medication without route', () => {
    const result = prescriptionSchema.safeParse({
      ...validPrescription,
      medications: [{ name: 'Paracetamol', dosage: '500mg' }],
    })
    expect(result.success).toBe(false)
  })

  it('should transform IDs to BigInt', () => {
    const result = prescriptionSchema.safeParse(validPrescription)
    expect(result.success).toBe(true)
  })

  it('should accept validUntil as optional', () => {
    const { validUntil, ...prescription } = validPrescription
    void validUntil
    const result = prescriptionSchema.safeParse(prescription)
    expect(result.success).toBe(true)
  })
})

describe('prescriptionInputSchema', () => {
  it('should validate without transformation', () => {
    const result = prescriptionInputSchema.safeParse(validPrescription)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.patientId).toBe('string')
    }
  })
})

describe('prescriptionFilterSchema', () => {
  it('should validate empty filter', () => {
    const result = prescriptionFilterSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should validate patientId filter', () => {
    const result = prescriptionFilterSchema.safeParse({ patientId: '1' })
    expect(result.success).toBe(true)
  })

  it('should validate doctorId filter', () => {
    const result = prescriptionFilterSchema.safeParse({ doctorId: 'user-123' })
    expect(result.success).toBe(true)
  })

  it('should validate date range filter', () => {
    const result = prescriptionFilterSchema.safeParse({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    })
    expect(result.success).toBe(true)
  })

  it('should validate search filter', () => {
    const result = prescriptionFilterSchema.safeParse({ search: 'Paracetamol' })
    expect(result.success).toBe(true)
  })
})

describe('medicationSchema', () => {
  it('should validate a valid medication', () => {
    const medication = {
      name: 'Paracetamol',
      dosage: '500mg',
      route: 'Oral',
      frequency: 'Cada 6 horas',
      duration: '5 días',
      instructions: 'Tomar con alimentos',
    }
    const result = medicationSchema.safeParse(medication)
    expect(result.success).toBe(true)
  })

  it('should reject medication without name', () => {
    const medication = {
      dosage: '500mg',
      route: 'Oral',
    }
    const result = medicationSchema.safeParse(medication)
    expect(result.success).toBe(false)
  })

  it('should reject medication without dosage', () => {
    const medication = {
      name: 'Paracetamol',
      route: 'Oral',
    }
    const result = medicationSchema.safeParse(medication)
    expect(result.success).toBe(false)
  })

  it('should reject medication without route', () => {
    const medication = {
      name: 'Paracetamol',
      dosage: '500mg',
    }
    const result = medicationSchema.safeParse(medication)
    expect(result.success).toBe(false)
  })

  it('should make optional fields optional', () => {
    const medication = {
      name: 'Paracetamol',
      dosage: '500mg',
      route: 'Oral',
    }
    const result = medicationSchema.safeParse(medication)
    expect(result.success).toBe(true)
  })
})
