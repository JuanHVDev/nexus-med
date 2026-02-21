export type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

export interface ImagingOrderPatient {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  curp?: string | null
  birthDate?: Date
}

export interface ImagingOrderDoctor {
  id: string
  name: string | null
  specialty?: string | null
  licenseNumber?: string | null
}

export interface ImagingOrderListItem {
  id: string
  clinicId: string
  patientId: string
  doctorId: string
  medicalNoteId: string | null
  orderDate: Date
  studyType: string
  bodyPart: string
  reason: string | null
  clinicalNotes: string | null
  status: OrderStatus
  reportUrl: string | null
  imagesUrl: string | null
  reportFileName: string | null
  imagesFileName: string | null
  findings: string | null
  impression: string | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  patient: ImagingOrderPatient
  doctor: ImagingOrderDoctor
}

export interface ImagingOrderDetail extends ImagingOrderListItem {}

export interface CreateImagingOrderInput {
  patientId: bigint
  doctorId: string
  medicalNoteId?: bigint
  studyType: string
  bodyPart: string
  reason?: string
  clinicalNotes?: string
}

export interface UpdateImagingOrderInput {
  status?: OrderStatus
  reportUrl?: string
  imagesUrl?: string
  reportFileName?: string
  imagesFileName?: string
  findings?: string
  impression?: string
}

export interface ImagingOrderFilters {
  patientId?: string
  doctorId?: string
  medicalNoteId?: string
  status?: OrderStatus
  studyType?: string
  fromDate?: Date
  toDate?: Date
}

export const ALLOWED_ROLES_FOR_CREATE = ["ADMIN", "DOCTOR"] as const
export const ALLOWED_ROLES_FOR_UPDATE = ["ADMIN", "DOCTOR"] as const
export const ALLOWED_ROLES_FOR_DELETE = ["ADMIN", "DOCTOR"] as const
