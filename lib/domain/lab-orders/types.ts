export type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
export type ResultFlag = "LOW" | "NORMAL" | "HIGH" | "CRITICAL"

export interface LabTest {
  name: string
  code?: string
  price?: number
}

export interface LabResultItem {
  id: string
  labOrderId: string
  testName: string
  result: string | null
  unit: string | null
  referenceRange: string | null
  flag: ResultFlag | null
  resultDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface LabOrderPatient {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  curp?: string | null
  birthDate?: Date
}

export interface LabOrderDoctor {
  id: string
  name: string | null
  specialty?: string | null
  licenseNumber?: string | null
}

export interface LabOrderListItem {
  id: string
  clinicId: string
  patientId: string
  doctorId: string
  medicalNoteId: string | null
  orderDate: Date
  tests: LabTest[]
  instructions: string | null
  status: OrderStatus
  resultsFileUrl: string | null
  resultsFileName: string | null
  createdAt: Date
  updatedAt: Date
  patient: LabOrderPatient
  doctor: LabOrderDoctor
  results: LabResultItem[]
}

export interface LabOrderDetail extends LabOrderListItem {}

export interface CreateLabOrderInput {
  patientId: bigint
  doctorId: string
  medicalNoteId?: bigint
  tests: LabTest[]
  instructions?: string
}

export interface UpdateLabOrderInput {
  status?: OrderStatus
  instructions?: string
  resultsFileUrl?: string
  resultsFileName?: string
}

export interface CreateLabResultInput {
  testName: string
  result?: string
  unit?: string
  referenceRange?: string
  flag?: ResultFlag
}

export interface LabOrderFilters {
  patientId?: string
  doctorId?: string
  medicalNoteId?: string
  status?: OrderStatus
  fromDate?: Date
  toDate?: Date
}

export const ALLOWED_ROLES_FOR_CREATE = ["ADMIN", "DOCTOR"] as const
export const ALLOWED_ROLES_FOR_UPDATE = ["ADMIN", "DOCTOR"] as const
export const ALLOWED_ROLES_FOR_DELETE = ["ADMIN", "DOCTOR"] as const
