'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Eye, 
  Pencil, 
  Trash2, 
  Plus, 
  Download, 
  FileText,
  User,
  FileHeart,
  ClipboardList,
  FlaskConical,
  Scan,
  Receipt,
  CreditCard,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AUDIT_ACTION_LABELS, ENTITY_TYPE_LABELS, type AuditAction, type EntityType, type AuditLog } from '@/lib/audit/types'

interface AuditTimelineProps {
  logs: AuditLog[]
}

function getActionIcon(action: AuditAction) {
  const iconClass = "h-4 w-4"
  switch (action) {
    case 'CREATE':
      return <Plus className={cn(iconClass, "text-green-500")} />
    case 'READ':
      return <Eye className={cn(iconClass, "text-blue-500")} />
    case 'UPDATE':
      return <Pencil className={cn(iconClass, "text-yellow-500")} />
    case 'DELETE':
      return <Trash2 className={cn(iconClass, "text-red-500")} />
    case 'EXPORT':
      return <Download className={cn(iconClass, "text-purple-500")} />
    case 'PDF_GENERATED':
      return <FileText className={cn(iconClass, "text-orange-500")} />
    default:
      return <Eye className={iconClass} />
  }
}

function getEntityIcon(entityType: string) {
  const iconClass = "h-4 w-4"
  switch (entityType) {
    case 'Patient':
      return <User className={iconClass} />
    case 'MedicalNote':
      return <FileHeart className={iconClass} />
    case 'Prescription':
      return <ClipboardList className={iconClass} />
    case 'LabOrder':
      return <FlaskConical className={iconClass} />
    case 'ImagingOrder':
      return <Scan className={iconClass} />
    case 'Invoice':
      return <Receipt className={iconClass} />
    case 'Payment':
      return <CreditCard className={iconClass} />
    case 'Appointment':
      return <Calendar className={iconClass} />
    default:
      return <FileText className={iconClass} />
  }
}

function getActionColor(action: AuditAction): string {
  switch (action) {
    case 'CREATE':
      return 'bg-green-500'
    case 'READ':
      return 'bg-blue-500'
    case 'UPDATE':
      return 'bg-yellow-500'
    case 'DELETE':
      return 'bg-red-500'
    case 'EXPORT':
      return 'bg-purple-500'
    case 'PDF_GENERATED':
      return 'bg-orange-500'
    default:
      return 'bg-gray-500'
  }
}

function formatTime(dateString: string): string {
  try {
    return format(new Date(dateString), "HH:mm", { locale: es })
  } catch {
    return dateString
  }
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), "EEEE, d 'de' MMMM", { locale: es })
  } catch {
    return dateString
  }
}

export function AuditTimeline({ logs }: AuditTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay registros para mostrar
      </div>
    )
  }

  const groupedLogs = logs.reduce((acc, log) => {
    const dateKey = format(new Date(log.createdAt), "yyyy-MM-dd", { locale: es })
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(log)
    return acc
  }, {} as Record<string, AuditLog[]>)

  const sortedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-8">
      {sortedDates.map((date) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-4 capitalize">
            {formatDate(groupedLogs[date][0].createdAt)}
          </h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {groupedLogs[date].map((log) => (
                <div key={log.id} className="relative flex gap-4">
                  <div className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background",
                    getActionColor(log.action)
                  )}>
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.userName}</span>
                          <span className="text-muted-foreground">
                            {AUDIT_ACTION_LABELS[log.action]}
                          </span>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            {getEntityIcon(log.entityType)}
                            <span className="text-sm">
                              {ENTITY_TYPE_LABELS[log.entityType as EntityType] || log.entityType}
                            </span>
                          </div>
                        </div>
                        {log.entityName && (
                          <p className="text-sm text-muted-foreground">
                            {log.entityName}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
