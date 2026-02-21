'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, 
  ShieldCheck, 
  Eye,
  Pencil,
  Trash2,
  Plus,
  FileText,
  Download,
} from 'lucide-react'
import { AUDIT_ACTION_LABELS, ENTITY_TYPE_LABELS, type AuditAction, type EntityType } from '@/lib/audit/types'
import { AuditTimeline } from './components/audit-timeline'

const AuditExportPDF = dynamic(
  () => import('./components/audit-export-pdf').then(mod => ({ default: mod.AuditExportPDF })),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Cargando...
      </Button>
    ),
  }
)

interface AuditLog {
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

interface AuditResponse {
  logs: AuditLog[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const ACTION_OPTIONS: { value: AuditAction | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todas las acciones' },
  { value: 'CREATE', label: 'Crear' },
  { value: 'READ', label: 'Ver' },
  { value: 'UPDATE', label: 'Actualizar' },
  { value: 'DELETE', label: 'Eliminar' },
  { value: 'EXPORT', label: 'Exportar' },
  { value: 'PDF_GENERATED', label: 'Generar PDF' },
]

const ENTITY_OPTIONS: { value: EntityType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos los tipos' },
  { value: 'Patient', label: 'Paciente' },
  { value: 'MedicalNote', label: 'Nota Medica' },
  { value: 'Prescription', label: 'Receta' },
  { value: 'LabOrder', label: 'Orden de Laboratorio' },
  { value: 'ImagingOrder', label: 'Orden de Imagenologia' },
  { value: 'Invoice', label: 'Factura' },
  { value: 'Payment', label: 'Pago' },
  { value: 'Appointment', label: 'Cita' },
]

function getActionIcon(action: AuditAction) {
  switch (action) {
    case 'CREATE':
      return <Plus className="h-4 w-4 text-green-500" />
    case 'READ':
      return <Eye className="h-4 w-4 text-blue-500" />
    case 'UPDATE':
      return <Pencil className="h-4 w-4 text-yellow-500" />
    case 'DELETE':
      return <Trash2 className="h-4 w-4 text-red-500" />
    case 'EXPORT':
      return <Download className="h-4 w-4 text-purple-500" />
    case 'PDF_GENERATED':
      return <FileText className="h-4 w-4 text-orange-500" />
    default:
      return null
  }
}

function getActionBadgeVariant(action: AuditAction): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (action) {
    case 'CREATE':
      return 'default'
    case 'READ':
      return 'secondary'
    case 'UPDATE':
      return 'outline'
    case 'DELETE':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [actionFilter, setActionFilter] = useState<AuditAction | 'ALL'>('ALL')
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType | 'ALL'>('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data, isLoading } = useQuery<AuditResponse>({
    queryKey: ['audit-logs', page, actionFilter, entityTypeFilter, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      if (actionFilter !== 'ALL') {
        params.set('action', actionFilter)
      }
      if (entityTypeFilter !== 'ALL') {
        params.set('entityType', entityTypeFilter)
      }
      if (startDate) {
        params.set('startDate', startDate)
      }
      if (endDate) {
        params.set('endDate', endDate)
      }

      const response = await fetch(`/api/audit?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Error al obtener registros')
      }
      return response.json()
    },
  })

  const handleClearFilters = () => {
    setActionFilter('ALL')
    setEntityTypeFilter('ALL')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss", { locale: es })
    } catch {
      return dateString
    }
  }

  const logs = data?.logs || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Registro de Auditoria
          </h2>
          <p className="text-muted-foreground">
            Historial de acciones realizadas en el sistema
          </p>
        </div>
        {logs.length > 0 && (
          <AuditExportPDF 
            logs={logs} 
            filters={{
              action: actionFilter,
              entityType: entityTypeFilter,
              startDate,
              endDate,
            }}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Accion</Label>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v as AuditAction | 'ALL'); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Registro</Label>
              <Select value={entityTypeFilter} onValueChange={(v) => { setEntityTypeFilter(v as EntityType | 'ALL'); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={handleClearFilters}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Tabla</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron registros de auditoria
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha/Hora</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Accion</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Registro</TableHead>
                        <TableHead>IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {formatDate(log.createdAt)}
                          </TableCell>
                          <TableCell>{log.userName}</TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.action)} className="gap-1">
                              {getActionIcon(log.action)}
                              {AUDIT_ACTION_LABELS[log.action]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {ENTITY_TYPE_LABELS[log.entityType as EntityType] || log.entityType}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.entityName || log.entityId}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.ipAddress || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, data.total)} de {data.total} registros
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                          disabled={page === data.totalPages}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <AuditTimeline logs={logs} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
