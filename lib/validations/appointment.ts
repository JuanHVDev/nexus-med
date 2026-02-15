import { z } from "zod"

export const appointmentStatusEnum = [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW"
] as const

export const appointmentBaseSchema = z.object({
  patientId: z.string().min(1, "Paciente requerido"),
  doctorId: z.string().min(1, "Doctor requerido"),
  startTime: z.string().min(1, "Fecha y hora de inicio requerida"),
  endTime: z.string().min(1, "Fecha y hora de fin requerida"),
  status: z.enum(appointmentStatusEnum),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

export const appointmentSchema = appointmentBaseSchema.transform((data) => {
  const MEXICO_OFFSET_MS = 6 * 60 * 60 * 1000
  const parseAsMexicoTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Date(date.getTime() + MEXICO_OFFSET_MS)
  }
  return {
    ...data,
    patientId: BigInt(data.patientId),
    startTime: parseAsMexicoTime(data.startTime),
    endTime: parseAsMexicoTime(data.endTime),
  }
})

export const appointmentInputSchema = appointmentBaseSchema

export const appointmentUpdateSchema = z.object({
  patientId: z.string().min(1).optional(),
  doctorId: z.string().min(1).optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
  status: z.enum(appointmentStatusEnum).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
}).partial()

export const appointmentUpdateTransform = appointmentUpdateSchema.transform((data) => {
  const result: Record<string, unknown> = {}
  
  if (data.patientId) result.patientId = BigInt(data.patientId)
  if (data.doctorId) result.doctorId = data.doctorId
  if (data.startTime) result.startTime = new Date(data.startTime)
  if (data.endTime) result.endTime = new Date(data.endTime)
  if (data.status) result.status = data.status
  if (data.reason !== undefined) result.reason = data.reason
  if (data.notes !== undefined) result.notes = data.notes
  
  return result
})

export const appointmentFilterSchema = z.object({
  doctorId: z.string().optional(),
  patientId: z.string().optional(),
  status: z.enum(appointmentStatusEnum).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type AppointmentStatus = (typeof appointmentStatusEnum)[number]
export type AppointmentFormData = z.infer<typeof appointmentSchema>
export type AppointmentInputFormData = z.infer<typeof appointmentInputSchema>
export type AppointmentUpdateFormData = z.infer<typeof appointmentUpdateSchema>
export type AppointmentFilterData = z.infer<typeof appointmentFilterSchema>
