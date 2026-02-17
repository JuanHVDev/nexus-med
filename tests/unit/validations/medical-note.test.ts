import { describe, it, expect } from 'vitest'
import { 
  medicalNoteSchema, 
  medicalNoteInputSchema, 
  medicalNoteUpdateSchema,
  vitalSignsSchema,
  specialties,
  noteTypeEnum
} from '@/lib/validations/medical-note'

const validMedicalNote = {
  patientId: '1',
  specialty: 'GENERAL' as const,
  type: 'CONSULTATION' as const,
  chiefComplaint: 'Dolor de cabeza',
  currentIllness: 'Inicio hace 3 días',
  vitalSigns: {
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72,
    temperature: 36.5,
    weight: 70,
    height: 170,
    oxygenSaturation: 98,
    respiratoryRate: 16,
  },
  physicalExam: 'Paciente en buenas condiciones generales',
  diagnosis: 'Cefalea tensional',
  prognosis: 'Bueno',
  treatment: 'Paracetamol 500mg cada 6 horas por 5 días',
  notes: 'Seguimiento en una semana',
}

describe('medicalNoteSchema', () => {
  it('should validate a valid medical note', () => {
    const result = medicalNoteSchema.safeParse(validMedicalNote)
    expect(result.success).toBe(true)
  })

  it('should reject empty patientId', () => {
    const result = medicalNoteSchema.safeParse({ ...validMedicalNote, patientId: '' })
    expect(result.success).toBe(false)
  })

  it('should reject empty chiefComplaint', () => {
    const result = medicalNoteSchema.safeParse({ ...validMedicalNote, chiefComplaint: '' })
    expect(result.success).toBe(false)
  })

  it('should reject empty diagnosis', () => {
    const result = medicalNoteSchema.safeParse({ ...validMedicalNote, diagnosis: '' })
    expect(result.success).toBe(false)
  })

  it('should reject invalid specialty', () => {
    const result = medicalNoteSchema.safeParse({ ...validMedicalNote, specialty: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('should reject invalid type', () => {
    const result = medicalNoteSchema.safeParse({ ...validMedicalNote, type: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('should accept all valid specialties', () => {
    for (const specialty of specialties) {
      const result = medicalNoteSchema.safeParse({ ...validMedicalNote, specialty })
      expect(result.success).toBe(true)
    }
  })

  it('should accept all valid types', () => {
    for (const type of noteTypeEnum) {
      const result = medicalNoteSchema.safeParse({ ...validMedicalNote, type })
      expect(result.success).toBe(true)
    }
  })

  it('should transform patientId to BigInt', () => {
    const result = medicalNoteSchema.safeParse(validMedicalNote)
    expect(result.success).toBe(true)
  })

  it('should stringify vitalSigns', () => {
    const result = medicalNoteSchema.safeParse(validMedicalNote)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.vitalSigns).toBe('string')
    }
  })

  it('should make optional fields nullable', () => {
    const minimal = {
      patientId: '1',
      chiefComplaint: 'Dolor',
      diagnosis: 'Test',
    }
    const result = medicalNoteSchema.safeParse(minimal)
    expect(result.success).toBe(true)
  })
})

describe('medicalNoteInputSchema', () => {
  it('should validate without transformation', () => {
    const result = medicalNoteInputSchema.safeParse(validMedicalNote)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.patientId).toBe('string')
    }
  })
})

describe('medicalNoteUpdateSchema', () => {
  it('should allow partial updates', () => {
    const result = medicalNoteUpdateSchema.safeParse({ diagnosis: 'Nuevo diagnóstico' })
    expect(result.success).toBe(true)
  })

  it('should allow multiple partial updates', () => {
    const result = medicalNoteUpdateSchema.safeParse({
      diagnosis: 'Nuevo diagnóstico',
      treatment: 'Nuevo tratamiento',
      notes: 'Nuevas notas',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid specialty in update', () => {
    const result = medicalNoteUpdateSchema.safeParse({ specialty: 'INVALID' })
    expect(result.success).toBe(false)
  })
})

describe('vitalSignsSchema', () => {
  it('should validate valid vital signs', () => {
    const vitals = {
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      heartRate: 72,
      temperature: 36.5,
      weight: 70,
      height: 170,
      oxygenSaturation: 98,
      respiratoryRate: 16,
    }
    const result = vitalSignsSchema.safeParse(vitals)
    expect(result.success).toBe(true)
  })

  it('should reject out of range blood pressure systolic', () => {
    const vitals = { bloodPressureSystolic: 300 }
    const result = vitalSignsSchema.safeParse(vitals)
    expect(result.success).toBe(false)
  })

  it('should reject out of range heart rate', () => {
    const vitals = { heartRate: 300 }
    const result = vitalSignsSchema.safeParse(vitals)
    expect(result.success).toBe(false)
  })

  it('should reject out of range temperature', () => {
    const vitals = { temperature: 50 }
    const result = vitalSignsSchema.safeParse(vitals)
    expect(result.success).toBe(false)
  })

  it('should reject out of range oxygen saturation', () => {
    const vitals = { oxygenSaturation: 20 }
    const result = vitalSignsSchema.safeParse(vitals)
    expect(result.success).toBe(false)
  })

  it('should accept all optional fields as undefined', () => {
    const result = vitalSignsSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
