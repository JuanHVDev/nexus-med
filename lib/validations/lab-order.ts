import { z } from 'zod'

export const labTestSchema = z.object({
  name: z.string().min(1, 'El nombre del estudio es requerido'),
  code: z.string().optional(),
  price: z.number().optional(),
})

export const labOrderCreateSchema = z.object({
  patientId: z.string().min(1, 'El paciente es requerido'),
  doctorId: z.string().min(1, 'El médico es requerido'),
  medicalNoteId: z.string().optional(),
  tests: z.array(labTestSchema).min(1, 'Seleccione al menos un estudio'),
  instructions: z.string().nullable().optional(),
})

export const labOrderUpdateSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  instructions: z.string().optional(),
})

export const labResultSchema = z.object({
  testName: z.string().min(1, 'El nombre del estudio es requerido'),
  result: z.string().optional(),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
  flag: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
})

export const labResultCreateSchema = z.object({
  results: z.array(labResultSchema).min(1),
})

export type LabOrderCreateInput = z.infer<typeof labOrderCreateSchema>
export type LabOrderUpdateInput = z.infer<typeof labOrderUpdateSchema>
export type LabResultCreateInput = z.infer<typeof labResultCreateSchema>
