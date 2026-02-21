import type { Appointment, Patient, User } from "@/generated/prisma/client"

export type AppointmentStatus = 
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"

export interface CreateAppointmentDTO {
  patientId: bigint
  doctorId: string
  startTime: Date
  endTime: Date
  status: AppointmentStatus
  reason?: string
  notes?: string
}

export interface UpdateAppointmentDTO {
  patientId?: bigint
  doctorId?: string
  startTime?: Date
  endTime?: Date
  status?: AppointmentStatus
  reason?: string
  notes?: string
}

export interface AppointmentFilter {
  clinicId: bigint
  doctorId?: string
  patientId?: bigint
  status?: AppointmentStatus
  startDate?: Date
  endDate?: Date
}

export interface AppointmentWithRelations {
  id: bigint
  clinicId: bigint
  patientId: bigint
  doctorId: string
  startTime: Date
  endTime: Date
  status: AppointmentStatus
  reason: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  patient: {
    id: bigint
    firstName: string
    lastName: string
    middleName: string | null
    phone: string | null
  }
  doctor: {
    id: string
    name: string
    specialty: string | null
  }
  medicalNote?: {
    id: bigint
  } | null
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor: string
  borderColor: string
  resource: {
    appointmentId: string
    patientId: string
    patientName: string
    doctorId: string
    doctorName: string
    status: AppointmentStatus
    reason: string | null
  }
}

export interface ConflictCheckInput {
  doctorId: string
  startTime: Date
  endTime: Date
  excludeAppointmentId?: bigint
  clinicId: bigint
}

export interface AppointmentRepository {
  findById(id: bigint, clinicId: bigint): Promise<AppointmentWithRelations | null>
  findMany(filter: AppointmentFilter, page: number, limit: number): Promise<{ appointments: AppointmentWithRelations[]; total: number }>
  findForCalendar(clinicId: bigint, start: Date, end: Date, doctorId?: string): Promise<AppointmentWithRelations[]>
  findConflicting(params: ConflictCheckInput): Promise<AppointmentWithRelations | null>
  create(data: CreateAppointmentDTO & { clinicId: bigint }): Promise<AppointmentWithRelations>
  update(id: bigint, data: UpdateAppointmentDTO): Promise<AppointmentWithRelations>
  updateStatus(id: bigint, status: AppointmentStatus): Promise<void>
  delete(id: bigint): Promise<void>
}

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  SCHEDULED: "#3b82f6",
  CONFIRMED: "#10b981",
  IN_PROGRESS: "#f59e0b",
  COMPLETED: "#6b7280",
  CANCELLED: "#ef4444",
  NO_SHOW: "#dc2626",
}

export const ALLOWED_ROLES_FOR_CREATE = ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"] as const
export const ALLOWED_ROLES_FOR_UPDATE = ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"] as const
export const ALLOWED_ROLES_FOR_DELETE = ["ADMIN", "DOCTOR", "RECEPTIONIST"] as const
