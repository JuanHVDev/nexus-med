export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'PDF_GENERATED'

export interface AuditLogEntry {
  action: AuditAction
  entityType: EntityType
  entityId: string
  entityName?: string
  ipAddress?: string
  userAgent?: string
}

export type EntityType =
  | 'Patient'
  | 'MedicalNote'
  | 'Prescription'
  | 'LabOrder'
  | 'ImagingOrder'
  | 'Invoice'
  | 'Payment'
  | 'Appointment'
  | 'Service'
  | 'User'
  | 'Clinic'

export interface AuditLogFilter {
  userId?: string
  action?: AuditAction
  entityType?: EntityType
  entityId?: string
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}

export interface AuditLogResponse {
  id: bigint
  userId: string
  userName: string
  action: AuditAction
  entityType: string
  entityId: string
  entityName: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: AuditAction
  entityType: string
  entityId: string
  entityName: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Crear',
  READ: 'Ver',
  UPDATE: 'Actualizar',
  DELETE: 'Eliminar',
  EXPORT: 'Exportar',
  PDF_GENERATED: 'Generar PDF',
}

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  Patient: 'Paciente',
  MedicalNote: 'Nota Medica',
  Prescription: 'Receta',
  LabOrder: 'Orden de Laboratorio',
  ImagingOrder: 'Orden de Imagenologia',
  Invoice: 'Factura',
  Payment: 'Pago',
  Appointment: 'Cita',
  Service: 'Servicio',
  User: 'Usuario',
  Clinic: 'Clinica',
}
