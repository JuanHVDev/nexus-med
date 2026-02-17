import { describe, it, expect } from 'vitest'
import { 
  patientSchema, 
  patientInputSchema, 
  patientEditSchema,
  emergencyContactSchema,
  medicalHistorySchema,
  vitalSignsSchema
} from '@/lib/validations/patient'

const validPatient = {
  firstName: 'Juan',
  lastName: 'Pérez',
  middleName: 'Carlos',
  curp: 'PEAJ900515HNLRRN01',
  birthDate: '1990-05-15',
  gender: 'MALE' as const,
  bloodType: 'O_POSITIVE' as const,
  email: 'juan.perez@example.com',
  phone: '5551234567',
  mobile: '5559876543',
  address: 'Av. Principal 123',
  city: 'Ciudad de México',
  state: 'CDMX',
  zipCode: '01000',
  notes: 'Paciente estable',
}

describe('patientSchema', () => {
  it('should validate a valid patient', () => {
    const result = patientSchema.safeParse(validPatient)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.firstName).toBe('Juan')
      expect(result.data.lastName).toBe('Pérez')
      expect(result.data.birthDate).toBeInstanceOf(Date)
    }
  })

  it('should reject empty firstName', () => {
    const result = patientSchema.safeParse({ ...validPatient, firstName: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('firstName')
    }
  })

  it('should reject empty lastName', () => {
    const result = patientSchema.safeParse({ ...validPatient, lastName: '' })
    expect(result.success).toBe(false)
  })

  it('should reject invalid CURP format', () => {
    const result = patientSchema.safeParse({ ...validPatient, curp: 'INVALID' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('curp')
    }
  })

  it('should accept valid CURP format', () => {
    const result = patientSchema.safeParse({ ...validPatient, curp: 'PEAJ900515HNLRRN01' })
    expect(result.success).toBe(true)
  })

  it('should reject invalid gender enum', () => {
    const result = patientSchema.safeParse({ ...validPatient, gender: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('should reject invalid bloodType enum', () => {
    const result = patientSchema.safeParse({ ...validPatient, bloodType: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('should reject invalid email format', () => {
    const result = patientSchema.safeParse({ ...validPatient, email: 'notanemail' })
    expect(result.success).toBe(false)
  })

  it('should accept valid email', () => {
    const result = patientSchema.safeParse({ ...validPatient, email: 'test@example.com' })
    expect(result.success).toBe(true)
  })

  it('should accept optional fields as undefined', () => {
    const { curp, email, phone, ...patientWithoutOptional } = validPatient
    void curp
    void email
    void phone
    const result = patientSchema.safeParse(patientWithoutOptional)
    expect(result.success).toBe(true)
  })

  it('should transform birthDate string to Date object', () => {
    const result = patientSchema.safeParse(validPatient)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.birthDate).toBeInstanceOf(Date)
    }
  })
})

describe('patientInputSchema', () => {
  it('should validate input without transformation', () => {
    const result = patientInputSchema.safeParse(validPatient)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.birthDate).toBe('string')
    }
  })
})

describe('patientEditSchema', () => {
  it('should allow partial updates', () => {
    const result = patientEditSchema.safeParse({ firstName: 'NuevoNombre' })
    expect(result.success).toBe(true)
  })

  it('should reject invalid fields in partial update', () => {
    const result = patientEditSchema.safeParse({ gender: 'INVALID' })
    expect(result.success).toBe(false)
  })
})

describe('emergencyContactSchema', () => {
  it('should validate valid emergency contact', () => {
    const contact = {
      name: 'María Pérez',
      relation: 'Esposa',
      phone: '5551234567',
      email: 'maria@example.com',
      isPrimary: true,
    }
    const result = emergencyContactSchema.safeParse(contact)
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const contact = {
      name: '',
      relation: 'Esposa',
      phone: '5551234567',
    }
    const result = emergencyContactSchema.safeParse(contact)
    expect(result.success).toBe(false)
  })

  it('should reject invalid email', () => {
    const contact = {
      name: 'María',
      relation: 'Esposa',
      phone: '5551234567',
      email: 'invalid-email',
    }
    const result = emergencyContactSchema.safeParse(contact)
    expect(result.success).toBe(false)
  })

  it('should default isPrimary to false', () => {
    const contact = {
      name: 'María',
      relation: 'Esposa',
      phone: '5551234567',
    }
    const result = emergencyContactSchema.safeParse(contact)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isPrimary).toBe(false)
    }
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
      glucose: 100,
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

  it('should accept all optional fields as undefined', () => {
    const result = vitalSignsSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe('medicalHistorySchema', () => {
  it('should validate valid medical history', () => {
    const history = {
      allergies: ['Penicilina', 'Polen'],
      currentMedications: ['Enalapril 10mg'],
      chronicDiseases: ['Hipertensión'],
      surgeries: ['Apendicectomía'],
      familyHistory: 'Padre con diabetes',
      personalHistory: 'Sin antecedentes relevantes',
      smoking: false,
      alcohol: true,
      drugs: false,
      exercise: 'Caminatas 3 veces por semana',
      diet: 'Baja en sal',
    }
    const result = medicalHistorySchema.safeParse(history)
    expect(result.success).toBe(true)
  })

  it('should default arrays to empty', () => {
    const result = medicalHistorySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.allergies).toEqual([])
      expect(result.data.currentMedications).toEqual([])
    }
  })

  it('should default booleans to false', () => {
    const result = medicalHistorySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.smoking).toBe(false)
      expect(result.data.alcohol).toBe(false)
      expect(result.data.drugs).toBe(false)
    }
  })
})
