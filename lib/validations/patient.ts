import { z } from "zod"

const patientBaseSchema = z.object({
  firstName: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "Apellido debe tener al menos 2 caracteres"),
  middleName: z.string().optional(),
  curp: z.string().optional(),
  birthDate: z.string().min(1, "Fecha de nacimiento requerida"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  bloodType: z.enum(["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"]).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
})

export const patientSchema = patientBaseSchema.transform(data => ({
  ...data,
  birthDate: new Date(data.birthDate),
}))

export const patientInputSchema = patientBaseSchema

export const emergencyContactSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  relation: z.string().min(2, "Parentesco requerido"),
  phone: z.string().min(10, "Teléfono requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  isPrimary: z.boolean().default(false),
})

export const patientEditSchema = patientBaseSchema.partial()

export const patientEditInputSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  middleName: z.string().optional(),
  curp: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  bloodType: z.enum(["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"]).optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
}).passthrough()

export type PatientEditInputFormData = z.infer<typeof patientEditInputSchema>

export const medicalHistorySchema = z.object({
  allergies: z.array(z.string()).default([]),
  currentMedications: z.array(z.string()).default([]),
  chronicDiseases: z.array(z.string()).default([]),
  surgeries: z.array(z.string()).default([]),
  familyHistory: z.string().optional(),
  smoking: z.boolean().default(false),
  alcohol: z.boolean().default(false),
  drugs: z.boolean().default(false),
  exercise: z.string().optional(),
  diet: z.string().optional(),
})

export type MedicalHistoryFormData = z.infer<typeof medicalHistorySchema>
export type PatientFormData = z.infer<typeof patientSchema>
export type PatientInputFormData = z.infer<typeof patientInputSchema>
export type EmergencyContactFormData = z.infer<typeof emergencyContactSchema>