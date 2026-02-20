import { prisma } from '@/lib/prisma'
import type { AuditAction, AuditLogEntry, AuditLogFilter, AuditLogResponse } from './types'
import { headers } from 'next/headers'

export async function logAudit(
  userId: string,
  entry: Omit<AuditLogEntry, 'ipAddress' | 'userAgent'>
): Promise<void> {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      headersList.get('x-real-ip') ||
                      null
    const userAgent = headersList.get('user-agent') || null

    await prisma.auditLog.create({
      data: {
        userId,
        action: entry.action as never,
        entityType: entry.entityType,
        entityId: entry.entityId,
        entityName: entry.entityName,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error('Error logging audit:', error)
  }
}

export async function getAuditLogs(
  filter: AuditLogFilter,
  currentUserId: string,
  userRole: string
): Promise<{ logs: AuditLogResponse[]; total: number }> {
  const page = filter.page || 1
  const pageSize = filter.pageSize || 50
  const skip = (page - 1) * pageSize

  const where: {
    userId?: string
    action?: AuditAction
    entityType?: string
    entityId?: string
    createdAt?: { gte?: Date; lte?: Date }
  } = {}

  if (userRole !== 'ADMIN') {
    where.userId = currentUserId
  } else if (filter.userId) {
    where.userId = filter.userId
  }

  if (filter.action) {
    where.action = filter.action as never
  }

  if (filter.entityType) {
    where.entityType = filter.entityType
  }

  if (filter.entityId) {
    where.entityId = filter.entityId
  }

  if (filter.startDate || filter.endDate) {
    where.createdAt = {}
    if (filter.startDate) {
      where.createdAt.gte = filter.startDate
    }
    if (filter.endDate) {
      where.createdAt.lte = filter.endDate
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs: logs.map((log: { id: bigint; userId: string; user: { name: string }; action: string; entityType: string; entityId: string; entityName: string | null; ipAddress: string | null; userAgent: string | null; createdAt: Date }) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user.name,
      action: log.action as AuditAction,
      entityType: log.entityType,
      entityId: log.entityId,
      entityName: log.entityName,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    })),
    total,
  }
}

export async function logPatientAccess(
  userId: string,
  patientId: bigint | string,
  patientName: string,
  action: AuditAction
): Promise<void> {
  await logAudit(userId, {
    action,
    entityType: 'Patient',
    entityId: String(patientId),
    entityName: patientName,
  })
}

export async function logMedicalNoteAccess(
  userId: string,
  noteId: bigint | string,
  patientName: string,
  action: AuditAction
): Promise<void> {
  await logAudit(userId, {
    action,
    entityType: 'MedicalNote',
    entityId: String(noteId),
    entityName: `Nota medica - ${patientName}`,
  })
}

export async function logPrescriptionAccess(
  userId: string,
  prescriptionId: bigint | string,
  patientName: string,
  action: AuditAction
): Promise<void> {
  await logAudit(userId, {
    action,
    entityType: 'Prescription',
    entityId: String(prescriptionId),
    entityName: `Receta - ${patientName}`,
  })
}

export async function logLabOrderAccess(
  userId: string,
  orderId: bigint | string,
  patientName: string,
  action: AuditAction
): Promise<void> {
  await logAudit(userId, {
    action,
    entityType: 'LabOrder',
    entityId: String(orderId),
    entityName: `Orden de laboratorio - ${patientName}`,
  })
}

export async function logImagingOrderAccess(
  userId: string,
  orderId: bigint | string,
  patientName: string,
  action: AuditAction
): Promise<void> {
  await logAudit(userId, {
    action,
    entityType: 'ImagingOrder',
    entityId: String(orderId),
    entityName: `Orden de imagenologia - ${patientName}`,
  })
}

export async function logInvoiceAccess(
  userId: string,
  invoiceId: bigint | string,
  invoiceNumber: string,
  action: AuditAction
): Promise<void> {
  await logAudit(userId, {
    action,
    entityType: 'Invoice',
    entityId: String(invoiceId),
    entityName: `Factura #${invoiceNumber}`,
  })
}
