import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getAuditLogs } from '@/lib/audit'
import { getUserRole } from '@/lib/clinic'
import type { AuditAction, EntityType } from '@/lib/audit/types'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = await getUserRole(session.user.id)
    if (!userRole) {
      return NextResponse.json({ error: 'Sin rol asignado' }, { status: 403 })
    }

    const currentUserId = session.user.id

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || undefined
    const action = searchParams.get('action') as AuditAction | null
    const entityType = searchParams.get('entityType') as EntityType | null
    const entityId = searchParams.get('entityId') || undefined
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)

    const startDate = startDateStr ? new Date(startDateStr) : undefined
    const endDate = endDateStr ? new Date(endDateStr) : undefined

    if (endDate) {
      endDate.setHours(23, 59, 59, 999)
    }

    const { logs, total } = await getAuditLogs(
      {
        userId,
        action: action || undefined,
        entityType: entityType || undefined,
        entityId,
        startDate,
        endDate,
        page,
        pageSize,
      },
      currentUserId,
      userRole
    )

    const serializedLogs = logs.map((log) => ({
      ...log,
      id: log.id.toString(),
      createdAt: log.createdAt.toISOString(),
    }))

    return NextResponse.json({
      logs: serializedLogs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Error al obtener registros de auditoria' },
      { status: 500 }
    )
  }
}
