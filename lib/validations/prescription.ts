import { z } from "zod"

export const medicationSchema = z.object({
  name: z.string().min(1, "Nombre del medicamento requerido"),
  dosage: z.string().min(1, "Dosis requerida"),
  route: z.string().min(1, "Vía de administración requerida"),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  instructions: z.string().optional(),
})

export const prescriptionBaseSchema = z.object({
  patientId: z.string().min(1, "Paciente requerido"),
  medicalNoteId: z.string().min(1, "Nota médica requerida"),
  medications: z.array(medicationSchema).min(1, "Al menos un medicamento requerido"),
  instructions: z.string().optional(),
  validUntil: z.string().optional(),
})

export const prescriptionSchema = prescriptionBaseSchema.transform((data) => ({
  ...data,
  patientId: BigInt(data.patientId),
  medicalNoteId: BigInt(data.medicalNoteId),
  validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
}))

export const prescriptionInputSchema = prescriptionBaseSchema

export const prescriptionFilterSchema = z.object({
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
})

export type Medication = z.infer<typeof medicationSchema>
export type PrescriptionFormData = z.infer<typeof prescriptionSchema>
export type PrescriptionInputFormData = z.infer<typeof prescriptionInputSchema>
export type PrescriptionFilterData = z.infer<typeof prescriptionFilterSchema>
