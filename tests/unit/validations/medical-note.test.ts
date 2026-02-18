import { describe, it, expect } from 'vitest'
import { 
  medicalNoteSchema, 
  medicalNoteInputSchema, 
  medicalNoteUpdateSchema,
  medicalNoteUpdateTransform,
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

  describe('bloodPressureSystolic boundaries', () => {
    it('should accept minimum value (50)', () => {
      const result = vitalSignsSchema.safeParse({ bloodPressureSystolic: 50 })
      expect(result.success).toBe(true)
    })

    it('should accept maximum value (250)', () => {
      const result = vitalSignsSchema.safeParse({ bloodPressureSystolic: 250 })
      expect(result.success).toBe(true)
    })

    it('should reject below minimum (49)', () => {
      const result = vitalSignsSchema.safeParse({ bloodPressureSystolic: 49 })
      expect(result.success).toBe(false)
    })

    it('should reject above maximum (251)', () => {
      const result = vitalSignsSchema.safeParse({ bloodPressureSystolic: 251 })
      expect(result.success).toBe(false)
    })
  })

  describe('bloodPressureDiastolic boundaries', () => {
    it('should accept minimum value (30)', () => {
      const result = vitalSignsSchema.safeParse({ bloodPressureDiastolic: 30 })
      expect(result.success).toBe(true)
    })

    it('should accept maximum value (150)', () => {
      const result = vitalSignsSchema.safeParse({ bloodPressureDiastolic: 150 })
      expect(result.success).toBe(true)
    })

    it('should reject below minimum (29)', () => {
      const result = vitalSignsSchema.safeParse({ bloodPressureDiastolic: 29 })
      expect(result.success).toBe(false)
    })

    it('should reject above maximum (151)', () => {
      const result = vitalSignsSchema.safeParse({ bloodPressureDiastolic: 151 })
      expect(result.success).toBe(false)
    })
  })

  describe('heartRate boundaries', () => {
    it('should accept minimum value (30)', () => {
      const result = vitalSignsSchema.safeParse({ heartRate: 30 })
      expect(result.success).toBe(true)
    })

    it('should accept maximum value (200)', () => {
      const result = vitalSignsSchema.safeParse({ heartRate: 200 })
      expect(result.success).toBe(true)
    })

    it('should reject below minimum (29)', () => {
      const result = vitalSignsSchema.safeParse({ heartRate: 29 })
      expect(result.success).toBe(false)
    })

    it('should reject above maximum (201)', () => {
      const result = vitalSignsSchema.safeParse({ heartRate: 201 })
      expect(result.success).toBe(false)
    })
  })

  describe('temperature boundaries', () => {
    it('should accept minimum value (30)', () => {
      const result = vitalSignsSchema.safeParse({ temperature: 30 })
      expect(result.success).toBe(true)
    })

    it('should accept maximum value (45)', () => {
      const result = vitalSignsSchema.safeParse({ temperature: 45 })
      expect(result.success).toBe(true)
    })

    it('should reject below minimum (29)', () => {
      const result = vitalSignsSchema.safeParse({ temperature: 29 })
      expect(result.success).toBe(false)
    })

    it('should reject above maximum (46)', () => {
      const result = vitalSignsSchema.safeParse({ temperature: 46 })
      expect(result.success).toBe(false)
    })
  })

  describe('weight boundaries', () => {
    it('should accept minimum value (1)', () => {
      const result = vitalSignsSchema.safeParse({ weight: 1 })
      expect(result.success).toBe(true)
    })

    it('should accept maximum value (500)', () => {
      const result = vitalSignsSchema.safeParse({ weight: 500 })
      expect(result.success).toBe(true)
    })

    it('should reject below minimum (0)', () => {
      const result = vitalSignsSchema.safeParse({ weight: 0 })
      expect(result.success).toBe(false)
    })

    it('should reject above maximum (501)', () => {
      const result = vitalSignsSchema.safeParse({ weight: 501 })
      expect(result.success).toBe(false)
    })
  })

  describe('height boundaries', () => {
    it('should accept minimum value (30)', () => {
      const result = vitalSignsSchema.safeParse({ height: 30 })
      expect(result.success).toBe(true)
    })

    it('should accept maximum value (300)', () => {
      const result = vitalSignsSchema.safeParse({ height: 300 })
      expect(result.success).toBe(true)
    })

    it('should reject below minimum (29)', () => {
      const result = vitalSignsSchema.safeParse({ height: 29 })
      expect(result.success).toBe(false)
    })

    it('should reject above maximum (301)', () => {
      const result = vitalSignsSchema.safeParse({ height: 301 })
      expect(result.success).toBe(false)
    })
  })

  describe('oxygenSaturation boundaries', () => {
    it('should accept minimum value (50)', () => {
      const result = vitalSignsSchema.safeParse({ oxygenSaturation: 50 })
      expect(result.success).toBe(true)
    })

    it('should accept maximum value (100)', () => {
      const result = vitalSignsSchema.safeParse({ oxygenSaturation: 100 })
      expect(result.success).toBe(true)
    })

    it('should reject below minimum (49)', () => {
      const result = vitalSignsSchema.safeParse({ oxygenSaturation: 49 })
      expect(result.success).toBe(false)
    })

    it('should reject above maximum (101)', () => {
      const result = vitalSignsSchema.safeParse({ oxygenSaturation: 101 })
      expect(result.success).toBe(false)
    })
  })

  describe('respiratoryRate boundaries', () => {
    it('should accept minimum value (8)', () => {
      const result = vitalSignsSchema.safeParse({ respiratoryRate: 8 })
      expect(result.success).toBe(true)
    })

    it('should accept maximum value (40)', () => {
      const result = vitalSignsSchema.safeParse({ respiratoryRate: 40 })
      expect(result.success).toBe(true)
    })

    it('should reject below minimum (7)', () => {
      const result = vitalSignsSchema.safeParse({ respiratoryRate: 7 })
      expect(result.success).toBe(false)
    })

    it('should reject above maximum (41)', () => {
      const result = vitalSignsSchema.safeParse({ respiratoryRate: 41 })
      expect(result.success).toBe(false)
    })
  })
})

describe('medicalNoteUpdateTransform', () => {
  it('should transform with specialty only', () => {
    const result = medicalNoteUpdateTransform.safeParse({ specialty: 'CARDIOLOGY' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ specialty: 'CARDIOLOGY' })
    }
  })

  it('should transform with type only', () => {
    const result = medicalNoteUpdateTransform.safeParse({ type: 'EMERGENCY' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ type: 'EMERGENCY' })
    }
  })

  it('should reject chiefComplaint empty string due to min(1)', () => {
    const result = medicalNoteUpdateTransform.safeParse({ chiefComplaint: '' })
    expect(result.success).toBe(false)
  })

  it('should transform with currentIllness empty string', () => {
    const result = medicalNoteUpdateTransform.safeParse({ currentIllness: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ currentIllness: '' })
    }
  })

  it('should transform vitalSigns to JSON string', () => {
    const vitalSigns = {
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      heartRate: 72,
    }
    const result = medicalNoteUpdateTransform.safeParse({ vitalSigns })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.vitalSigns).toBe(JSON.stringify(vitalSigns))
      expect(typeof result.data.vitalSigns).toBe('string')
    }
  })

  it('should transform with physicalExam empty string', () => {
    const result = medicalNoteUpdateTransform.safeParse({ physicalExam: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ physicalExam: '' })
    }
  })

  it('should reject diagnosis empty string due to min(1)', () => {
    const result = medicalNoteUpdateTransform.safeParse({ diagnosis: '' })
    expect(result.success).toBe(false)
  })

  it('should transform with prognosis empty string', () => {
    const result = medicalNoteUpdateTransform.safeParse({ prognosis: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ prognosis: '' })
    }
  })

  it('should transform with treatment empty string', () => {
    const result = medicalNoteUpdateTransform.safeParse({ treatment: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ treatment: '' })
    }
  })

  it('should transform with notes empty string', () => {
    const result = medicalNoteUpdateTransform.safeParse({ notes: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ notes: '' })
    }
  })

  it('should transform with all fields populated', () => {
    const allFields = {
      specialty: 'GENERAL' as const,
      type: 'CONSULTATION' as const,
      chiefComplaint: 'Dolor de cabeza',
      currentIllness: 'Inicio hace 3 días',
      vitalSigns: {
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 72,
      },
      physicalExam: 'Paciente estable',
      diagnosis: 'Cefalea',
      prognosis: 'Bueno',
      treatment: 'Paracetamol',
      notes: 'Seguimiento',
    }
    const result = medicalNoteUpdateTransform.safeParse(allFields)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.specialty).toBe('GENERAL')
      expect(result.data.type).toBe('CONSULTATION')
      expect(result.data.chiefComplaint).toBe('Dolor de cabeza')
      expect(result.data.currentIllness).toBe('Inicio hace 3 días')
      expect(typeof result.data.vitalSigns).toBe('string')
      expect(result.data.physicalExam).toBe('Paciente estable')
      expect(result.data.diagnosis).toBe('Cefalea')
      expect(result.data.prognosis).toBe('Bueno')
      expect(result.data.treatment).toBe('Paracetamol')
      expect(result.data.notes).toBe('Seguimiento')
    }
  })

  it('should transform empty object to empty result', () => {
    const result = medicalNoteUpdateTransform.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({})
    }
  })

  it('should not include undefined vitalSigns', () => {
    const result = medicalNoteUpdateTransform.safeParse({ diagnosis: 'Test' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.vitalSigns).toBeUndefined()
    }
  })

  it('should not include undefined specialty', () => {
    const result = medicalNoteUpdateTransform.safeParse({ diagnosis: 'Test' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.specialty).toBeUndefined()
    }
  })

  it('should not include undefined type', () => {
    const result = medicalNoteUpdateTransform.safeParse({ diagnosis: 'Test' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBeUndefined()
    }
  })
})
