import { z } from 'zod'

export const imagingOrderCreateSchema = z.object({
  patientId: z.string().min(1, 'El paciente es requerido'),
  doctorId: z.string().min(1, 'El médico es requerido'),
  medicalNoteId: z.string().optional(),
  studyType: z.string().min(1, 'El tipo de estudio es requerido'),
  bodyPart: z.string().min(1, 'La región corporal es requerida'),
  reason: z.string().nullable().optional(),
  clinicalNotes: z.string().nullable().optional(),
})

export const imagingOrderUpdateSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  reportUrl: z.string().nullable().optional(),
  imagesUrl: z.string().nullable().optional(),
  reportFileName: z.string().nullable().optional(),
  imagesFileName: z.string().nullable().optional(),
  findings: z.string().optional(),
  impression: z.string().optional(),
})

export type ImagingOrderCreateInput = z.infer<typeof imagingOrderCreateSchema>
export type ImagingOrderUpdateInput = z.infer<typeof imagingOrderUpdateSchema>

export const STUDY_TYPES = [
  { value: 'RX', label: 'Radiografía Simple' },
  { value: 'USG', label: 'Ultrasonido' },
  { value: 'TAC', label: 'Tomografía (TAC)' },
  { value: 'RM', label: 'Resonancia Magnética (RM)' },
  { value: 'ECG', label: 'Electrocardiograma (ECG)' },
  { value: 'EO', label: 'Espirometría' },
  { value: 'MAM', label: 'Mastografía' },
  { value: 'DENS', label: 'Densitometría Ósea' },
  { value: 'OTRO', label: 'Otro' },
]
