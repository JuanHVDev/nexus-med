export type Gender = "MALE" | "FEMALE" | "OTHER"
export type BloodType =
  | "A_POSITIVE"
  | "A_NEGATIVE"
  | "B_POSITIVE"
  | "B_NEGATIVE"
  | "AB_POSITIVE"
  | "AB_NEGATIVE"
  | "O_POSITIVE"
  | "O_NEGATIVE"

export interface MedicalHistory {
  id: string
  patientId: string
  allergies: string[]
  currentMedications: string[]
  chronicDiseases: string[]
  surgeries: string[]
  familyHistory: string | null
  personalHistory: string | null
  smoking: boolean
  alcohol: boolean
  drugs: boolean
  exercise: string | null
  diet: string | null
  vitalSigns: Record<string, unknown> | null
  vitalSignsRecordedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface EmergencyContact {
  id: string
  patientId: string
  name: string
  relation: string
  phone: string
  email: string | null
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PatientListItem {
  id: string
  clinicId: string
  firstName: string
  lastName: string
  middleName: string | null
  curp: string | null
  birthDate: Date
  gender: Gender
  bloodType: BloodType | null
  email: string | null
  phone: string | null
  mobile: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  isActive: boolean
  deletedAt: Date | null
  notes: string | null
  photoUrl: string | null
  photoName: string | null
  userId: string | null
  createdAt: Date
  updatedAt: Date
  medicalHistory: MedicalHistory | null
}

export interface PatientDetail extends PatientListItem {
  emergencyContacts: EmergencyContact[]
  _count?: {
    appointments: number
    medicalNotes: number
  }
}

export interface CreatePatientInput {
  firstName: string
  lastName: string
  middleName?: string
  curp?: string
  birthDate: Date
  gender: Gender
  bloodType?: BloodType
  email?: string
  phone?: string
  mobile?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  notes?: string
}

export interface UpdatePatientInput {
  firstName?: string
  lastName?: string
  middleName?: string
  curp?: string
  birthDate?: Date
  gender?: Gender
  bloodType?: BloodType
  email?: string
  phone?: string
  mobile?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  notes?: string
  photoUrl?: string
  photoName?: string
}

export interface UpdateMedicalHistoryInput {
  allergies?: string[]
  currentMedications?: string[]
  chronicDiseases?: string[]
  surgeries?: string[]
  familyHistory?: string
  personalHistory?: string
  smoking?: boolean
  alcohol?: boolean
  drugs?: boolean
  exercise?: string
  diet?: string
  vitalSigns?: Record<string, unknown>
}

export interface CreateEmergencyContactInput {
  name: string
  relation: string
  phone: string
  email?: string
  isPrimary?: boolean
}

export interface PatientFilters {
  search?: string
  includeDeleted?: boolean
}

export interface PatientListResult {
  data: PatientListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export const ALLOWED_ROLES_FOR_CREATE = ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"] as const
export const ALLOWED_ROLES_FOR_UPDATE = ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"] as const
export const ALLOWED_ROLES_FOR_DELETE = ["ADMIN"] as const
export const ALLOWED_ROLES_FOR_RESTORE = ["ADMIN"] as const
export const ALLOWED_ROLES_FOR_HISTORY = ["ADMIN", "DOCTOR", "NURSE"] as const
export const ALLOWED_ROLES_FOR_CONTACTS = ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"] as const

export interface PatientNoteSimple {
  id: string
  clinicId: string
  patientId: string
  doctorId: string
  appointmentId: string | null
  specialty: string | null
  type: string | null
  chiefComplaint: string
  currentIllness: string | null
  vitalSigns: unknown
  physicalExam: string | null
  diagnosis: string | null
  prognosis: string | null
  treatment: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  doctor: { id: string; name: string; specialty: string | null }
}
