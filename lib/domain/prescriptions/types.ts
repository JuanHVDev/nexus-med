export interface Medication {
  name: string
  dosage: string
  route: string
  frequency?: string
  duration?: string
  instructions?: string
}

export interface PrescriptionPatient {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  curp: string | null
}

export interface PrescriptionDoctor {
  id: string
  name: string | null
  specialty: string | null
  licenseNumber: string | null
}

export interface PrescriptionMedicalNote {
  id: string
  createdAt: Date
}

export interface PrescriptionListItem {
  id: string
  patientId: string
  doctorId: string
  medicalNoteId: string
  medications: Medication[]
  instructions: string | null
  issueDate: Date
  validUntil: Date | null
  digitalSignature: string | null
  createdAt: Date
  updatedAt: Date
  patient: PrescriptionPatient
  doctor: PrescriptionDoctor
  medicalNote: PrescriptionMedicalNote
}

export interface PrescriptionDetail extends PrescriptionListItem {}

export interface CreatePrescriptionInput {
  patientId: bigint
  medicalNoteId: bigint
  medications: Medication[]
  instructions?: string
  validUntil?: Date
}

export interface UpdatePrescriptionInput {
  medications?: Medication[]
  instructions?: string
  validUntil?: Date
  digitalSignature?: string
}

export interface PrescriptionFilters {
  patientId?: string
  doctorId?: string
  search?: string
}

export interface PrescriptionListResult {
  data: PrescriptionListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export const ALLOWED_ROLES_FOR_CREATE = ["ADMIN", "DOCTOR"] as const
export const ALLOWED_ROLES_FOR_UPDATE = ["ADMIN", "DOCTOR"] as const
