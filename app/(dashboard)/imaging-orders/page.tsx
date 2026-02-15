'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  Loader2,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { STUDY_TYPES } from '@/lib/validations/imaging-order'

interface ImagingOrder {
  id: string
  clinicId: string
  patientId: string
  doctorId: string
  medicalNoteId: string | null
  orderDate: string
  studyType: string
  bodyPart: string
  reason: string | null
  clinicalNotes: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  reportUrl: string | null
  imagesUrl: string | null
  findings: string | null
  impression: string | null
  completedAt: string | null
  patient: {
    id: string
    firstName: string
    lastName: string
    middleName: string | null
  } | null
  doctor: {
    id: string
    name: string
  } | null
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
}

interface Doctor {
  id: string
  name: string
}

export default function ImagingOrdersPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    studyType: '',
    bodyPart: '',
    reason: '',
    clinicalNotes: '',
  })

  const { data: orders, isLoading } = useQuery<ImagingOrder[]>({
    queryKey: ['imaging-orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/imaging-orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const res = await fetch('/api/patients?limit=1000')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      return data.data || []
    }
  })

  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await fetch('/api/users/doctors')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      return data.data || []
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/imaging-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: data.patientId,
          doctorId: data.doctorId,
          studyType: data.studyType,
          bodyPart: data.bodyPart,
          reason: data.reason || undefined,
          clinicalNotes: data.clinicalNotes || undefined,
        })
      })
      if (!res.ok) throw new Error('Failed to create')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-orders'] })
      setDialogOpen(false)
      setFormData({ patientId: '', doctorId: '', studyType: '', bodyPart: '', reason: '', clinicalNotes: '' })
      toast.success('Orden de imagenología creada')
    },
    onError: () => toast.error('Error al crear orden')
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/imaging-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-orders'] })
      toast.success('Estado actualizado')
    },
    onError: () => toast.error('Error al actualizar')
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/imaging-orders/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-orders'] })
      setDeletingOrderId(null)
      toast.success('Orden eliminada')
    },
    onError: () => toast.error('Error al eliminar')
  })

  const filteredOrders = orders?.filter(order => {
    const patientName = `${order.patient?.firstName} ${order.patient?.lastName}`.toLowerCase()
    return patientName.includes(searchTerm.toLowerCase())
  }) || []

  const getStudyTypeLabel = (value: string) => {
    return STUDY_TYPES.find(t => t.value === value)?.label || value
  }

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateMutation.mutate({ id: orderId, status: newStatus })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Órdenes de Imagenología</h1>
          <p className="text-muted-foreground">
            Gestiona las órdenes de estudios de imagen (RX, USG, TAC, RM, etc.)
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="IN_PROGRESS">En proceso</SelectItem>
            <SelectItem value="COMPLETED">Completado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Orden de Imagenología</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Paciente</Label>
                  <Select
                    value={formData.patientId}
                    onValueChange={(v) => setFormData({ ...formData, patientId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} {p.middleName || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Médico</Label>
                  <Select
                    value={formData.doctorId}
                    onValueChange={(v) => setFormData({ ...formData, doctorId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar médico" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors?.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de estudio</Label>
                  <Select
                    value={formData.studyType}
                    onValueChange={(v) => setFormData({ ...formData, studyType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDY_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Región corporal</Label>
                  <Input
                    value={formData.bodyPart}
                    onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                    placeholder="Ej: Tórax, Abdomen, Mano derecha"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Motivo/Indicación</Label>
                <Input
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ej: Tos persistente, Dolor abdominal"
                />
              </div>
              <div className="space-y-2">
                <Label>Notas clínicas</Label>
                <Textarea
                  value={formData.clinicalNotes}
                  onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                  placeholder="Información adicional relevante..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.patientId || !formData.doctorId || !formData.studyType || !formData.bodyPart || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Orden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Tipo de estudio</TableHead>
                <TableHead>Región</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay órdenes de imagenología
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>{new Date(order.orderDate).toLocaleDateString('es-MX')}</TableCell>
                    <TableCell className="font-medium">
                      {order.patient?.firstName} {order.patient?.lastName}
                    </TableCell>
                    <TableCell>{order.doctor?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getStudyTypeLabel(order.studyType)}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.bodyPart}</TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(v) => handleStatusChange(order.id, v)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pendiente</SelectItem>
                          <SelectItem value="IN_PROGRESS">En proceso</SelectItem>
                          <SelectItem value="COMPLETED">Completado</SelectItem>
                          <SelectItem value="CANCELLED">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingOrderId(order.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deletingOrderId} onOpenChange={(open) => !open && setDeletingOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar orden?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingOrderId && deleteMutation.mutate(deletingOrderId)} className="bg-destructive">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
