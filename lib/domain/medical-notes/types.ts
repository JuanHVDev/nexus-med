import { Specialty, noteTypeEnum } from "@/lib/validations/medical-note"

export type NoteType = (typeof noteTypeEnum)[number]

export interface VitalSigns {
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  heartRate?: number
  temperature?: number
  weight?: number
  height?: number
  oxygenSaturation?: number
  respiratoryRate?: number
}

export interface MedicalNotePatient {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
}

export interface MedicalNoteDoctor {
  id: string
  name: string | null
  email: string
  specialty: string | null
  licenseNumber: string | null
}

export interface MedicalNoteListItem {
  id: string
  clinicId: string
  patientId: string
  doctorId: string
  appointmentId: string | null
  specialty: Specialty | null
  type: NoteType | null
  chiefComplaint: string
  diagnosis: string
  createdAt: Date
  updatedAt: Date
  patient: MedicalNotePatient
  doctor: {
    id: string
    name: string | null
    specialty: string | null
  }
}

export interface MedicalNoteDetail extends MedicalNoteListItem {
  currentIllness: string | null
  vitalSigns: VitalSigns | null
  physicalExam: string | null
  prognosis: string | null
  treatment: string | null
  notes: string | null
  doctor: MedicalNoteDoctor
  appointment: {
    id: string
    clinicId: string
    patientId: string
    doctorId: string
    startTime: Date
    endTime: Date
    status: string
    reason: string | null
    notes: string | null
  } | null
  prescriptions: Array<{
    id: string
    patientId: string
    doctorId: string
    medicalNoteId: string
    medications: unknown
    instructions: string | null
    issueDate: Date
    validUntil: Date | null
    createdAt: Date
  }>
}

export interface CreateMedicalNoteInput {
  patientId: bigint
  appointmentId?: bigint
  specialty?: Specialty
  type?: NoteType
  chiefComplaint: string
  currentIllness?: string
  vitalSigns?: VitalSigns
  physicalExam?: string
  diagnosis: string
  prognosis?: string
  treatment?: string
  notes?: string
}

export interface UpdateMedicalNoteInput {
  specialty?: Specialty
  type?: NoteType
  chiefComplaint?: string
  currentIllness?: string
  vitalSigns?: VitalSigns
  physicalExam?: string
  diagnosis?: string
  prognosis?: string
  treatment?: string
  notes?: string
}

export interface MedicalNoteFilters {
  patientId?: string
  doctorId?: string
  startDate?: Date
  endDate?: Date
  search?: string
}

export interface MedicalNoteListResult {
  data: MedicalNoteListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface MedicalNoteRepository {
  findByClinic(
    clinicId: bigint,
    filters: MedicalNoteFilters,
    page: number,
    limit: number
  ): Promise<MedicalNoteListResult>

  findById(id: bigint, clinicId: bigint): Promise<MedicalNoteDetail | null>

  findByAppointmentId(appointmentId: bigint): Promise<{ id: bigint } | null>

  create(
    clinicId: bigint,
    doctorId: string,
    data: CreateMedicalNoteInput
  ): Promise<MedicalNoteListItem>

  update(
    id: bigint,
    data: UpdateMedicalNoteInput
  ): Promise<MedicalNoteListItem>

  updateAppointmentStatus(appointmentId: bigint, status: string): Promise<void>
}

export interface PatientRepository {
  existsInClinic(patientId: bigint, clinicId: bigint): Promise<boolean>
}
