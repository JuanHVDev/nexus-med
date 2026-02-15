import { z } from "zod"

export const specialties = [
  'GENERAL',
  'PEDIATRICS',
  'CARDIOLOGY',
  'DERMATOLOGY',
  'GYNECOLOGY',
  'ORTHOPEDICS',
  'NEUROLOGY',
  'OPHTHALMOLOGY',
  'OTORHINOLARYNGOLOGY',
  'PSYCHIATRY'
] as const

export type Specialty = (typeof specialties)[number]

export const specialtyLabels: Record<Specialty, string> = {
  GENERAL: 'Medicina General',
  PEDIATRICS: 'Pediatría',
  CARDIOLOGY: 'Cardiología',
  DERMATOLOGY: 'Dermatología',
  GYNECOLOGY: 'Ginecología',
  ORTHOPEDICS: 'Ortopedia',
  NEUROLOGY: 'Neurología',
  OPHTHALMOLOGY: 'Oftalmología',
  OTORHINOLARYNGOLOGY: 'Otorrinolaringología',
  PSYCHIATRY: 'Psiquiatría'
}

export const vitalSignsSchema = z.object({
  bloodPressureSystolic: z.number().min(50).max(250).optional(),
  bloodPressureDiastolic: z.number().min(30).max(150).optional(),
  heartRate: z.number().min(30).max(200).optional(),
  temperature: z.number().min(30).max(45).optional(),
  weight: z.number().min(1).max(500).optional(),
  height: z.number().min(30).max(300).optional(),
  oxygenSaturation: z.number().min(50).max(100).optional(),
  respiratoryRate: z.number().min(8).max(40).optional(),
})

export const noteTypeEnum = ['CONSULTATION', 'FOLLOWUP', 'EMERGENCY', 'PROCEDURE'] as const

export const medicalNoteBaseSchema = z.object({
  patientId: z.string().min(1, "Paciente requerido"),
  appointmentId: z.string().optional(),
  specialty: z.enum(specialties).optional(),
  type: z.enum(noteTypeEnum).optional(),
  chiefComplaint: z.string().min(1, "Motivo de consulta requerido"),
  currentIllness: z.string().optional(),
  vitalSigns: vitalSignsSchema.optional(),
  physicalExam: z.string().optional(),
  diagnosis: z.string().min(1, "Diagnóstico requerido"),
  prognosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
})

export const medicalNoteSchema = medicalNoteBaseSchema.transform((data) => ({
  ...data,
  patientId: BigInt(data.patientId),
  appointmentId: data.appointmentId ? BigInt(data.appointmentId) : undefined,
  vitalSigns: data.vitalSigns ? JSON.stringify(data.vitalSigns) : undefined,
}))

export const medicalNoteInputSchema = medicalNoteBaseSchema

export const medicalNoteUpdateSchema = z.object({
  specialty: z.enum(specialties).optional(),
  type: z.enum(noteTypeEnum).optional(),
  chiefComplaint: z.string().min(1).optional(),
  currentIllness: z.string().optional(),
  vitalSigns: vitalSignsSchema.optional(),
  physicalExam: z.string().optional(),
  diagnosis: z.string().min(1).optional(),
  prognosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
}).partial()

export const medicalNoteUpdateTransform = medicalNoteUpdateSchema.transform((data) => {
  const result: Record<string, unknown> = {}
  
  if (data.specialty) result.specialty = data.specialty
  if (data.type) result.type = data.type
  if (data.chiefComplaint !== undefined) result.chiefComplaint = data.chiefComplaint
  if (data.currentIllness !== undefined) result.currentIllness = data.currentIllness
  if (data.vitalSigns) result.vitalSigns = JSON.stringify(data.vitalSigns)
  if (data.physicalExam !== undefined) result.physicalExam = data.physicalExam
  if (data.diagnosis !== undefined) result.diagnosis = data.diagnosis
  if (data.prognosis !== undefined) result.prognosis = data.prognosis
  if (data.treatment !== undefined) result.treatment = data.treatment
  if (data.notes !== undefined) result.notes = data.notes
  
  return result
})

export const templateFields: Record<Specialty, {
  requiredPhysicalExam: string[]
  defaultNotes: string
}> = {
  GENERAL: {
    requiredPhysicalExam: ['Estado general', 'Cabeza y cuello', 'Tórax', 'Abdomen', 'Extremidades'],
    defaultNotes: 'Paciente estable, se indica tratamiento y seguimiento.'
  },
  PEDIATRICS: {
    requiredPhysicalExam: ['Estado general', 'Cabeza', 'Oídos', 'Ojos', 'Nariz', 'Boca', 'Cuello', 'Tórax', 'Abdomen', 'Extremidades', 'Piel'],
    defaultNotes: 'Paciente en edad pediátrica, desarrollo normal para su edad.'
  },
  CARDIOLOGY: {
    requiredPhysicalExam: ['Estado general', 'Presión arterial', 'Frecuencia cardiaca', 'Cuello', 'Tórax', 'Auscultación cardiaca', 'Auscultación pulmonar', 'Edema'],
    defaultNotes: 'Se recomienda ECG y estudios complementarios.'
  },
  DERMATOLOGY: {
    requiredPhysicalExam: ['Estado general', 'Inspección de piel', 'Lesiones primarias', 'Distribución', 'Morphología'],
    defaultNotes: 'Se indica tratamiento tópico.'
  },
  GYNECOLOGY: {
    requiredPhysicalExam: ['Estado general', 'Mamas', 'Abdomen', 'Genitales externos', 'Especuloscopia', 'Tacto vaginal'],
    defaultNotes: 'Se indica estudio de imagen y laboratorios.'
  },
  ORTHOPEDICS: {
    requiredPhysicalExam: ['Estado general', 'Inspección', 'Palpación', 'Movilidad articular', 'Fuerza muscular', 'Sensibilidad'],
    defaultNotes: 'Se indica radiografía y rehabilitación.'
  },
  NEUROLOGY: {
    requiredPhysicalExam: ['Estado mental', 'Pares craneales', 'Motor', 'Sensibilidad', 'Reflejos', 'Coordinación', 'Marcha'],
    defaultNotes: 'Se indica estudio de neuroimagen.'
  },
  OPHTHALMOLOGY: {
    requiredPhysicalExam: ['Agudeza visual', 'Reflejo pupilar', 'Fondo de ojo', 'Presión intraocular', 'Segmento anterior'],
    defaultNotes: 'Se indica evaluación oftalmológica completa.'
  },
  OTORHINOLARYNGOLOGY: {
    requiredPhysicalExam: ['Pabellones auriculares', 'Conducto auditivo', 'Tímpano', 'Nariz', 'Senos paranasales', 'Faringe', 'Laringe'],
    defaultNotes: 'Se indica estudio audiométrico.'
  },
  PSYCHIATRY: {
    requiredPhysicalExam: ['Apariencia', 'Actitud', 'Estado de ánimo', 'Afecto', 'Pensamiento', 'Percepción', 'Cognición', 'Juicio'],
    defaultNotes: 'Se indica evaluación psicológica y seguimiento.'
  }
}

export type MedicalNoteFormData = z.infer<typeof medicalNoteSchema>
export type MedicalNoteInputFormData = z.infer<typeof medicalNoteInputSchema>
export type MedicalNoteUpdateFormData = z.infer<typeof medicalNoteUpdateSchema>
export type VitalSignsData = z.infer<typeof vitalSignsSchema>
