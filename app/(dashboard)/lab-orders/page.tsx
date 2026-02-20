'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  FileText,
  X,
  Upload
} from 'lucide-react'
import { toast } from 'sonner'
import { FileUpload } from '@/components/ui/file-upload'

interface LabOrder {
  id: string
  clinicId: string
  patientId: string
  doctorId: string
  medicalNoteId: string | null
  orderDate: string
  tests: { name: string; code?: string }[]
  instructions: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  resultsFileUrl: string | null
  resultsFileName: string | null
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
  results: LabResult[]
}

interface LabResult {
  id: string
  labOrderId: string
  testName: string
  result: string | null
  unit: string | null
  referenceRange: string | null
  flag: string | null
  resultDate: string | null
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

const COMMON_LAB_TESTS = [
  { name: 'Biometría hemática completa', code: 'BHC' },
  { name: 'Química sanguínea (6 elementos)', code: 'QS6' },
  { name: 'Análisis de orina', code: 'EO' },
  { name: 'Perfil lipídico', code: 'PL' },
  { name: 'Pruebas de función tiroidea', code: 'T3T4TSH' },
  { name: 'Glucosa en sangre', code: 'GLU' },
  { name: 'Hemoglobina glicosilada', code: 'HbA1c' },
  { name: 'Examen general de heces', code: 'EGH' },
  { name: 'Tiempo de protrombina', code: 'TP' },
  { name: 'Tiempo de tromboplastina', code: 'TTP' },
]

const STATUS_COLORS = {
  PENDING: 'bg-yellow-500',
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
}

export default function LabOrdersPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null)
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    instructions: '',
    selectedTests: [] as string[],
  })

  const [resultsData, setResultsData] = useState<{
    testName: string
    result: string
    unit: string
    referenceRange: string
    flag: string
  }[]>([])

  const { data: orders, isLoading } = useQuery<LabOrder[]>({
    queryKey: ['lab-orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/lab-orders?${params}`)
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
      const tests = data.selectedTests.map(name => ({ name, code: COMMON_LAB_TESTS.find(t => t.name === name)?.code }))
      const res = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: data.patientId,
          doctorId: data.doctorId,
          tests,
          instructions: data.instructions || undefined,
        })
      })
      if (!res.ok) throw new Error('Failed to create')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      setDialogOpen(false)
      setFormData({ patientId: '', doctorId: '', instructions: '', selectedTests: [] })
      toast.success('Orden de laboratorio creada')
    },
    onError: () => toast.error('Error al crear orden')
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/lab-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      toast.success('Estado actualizado')
    },
    onError: () => toast.error('Error al actualizar')
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/lab-orders/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      setDeletingOrderId(null)
      toast.success('Orden eliminada')
    },
    onError: () => toast.error('Error al eliminar')
  })

  const uploadFileMutation = useMutation({
    mutationFn: async ({ id, resultsFileUrl, resultsFileName }: { id: string; resultsFileUrl: string; resultsFileName: string }) => {
      const res = await fetch(`/api/lab-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultsFileUrl, resultsFileName })
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      setUploadDialogOpen(false)
      setUploadingOrderId(null)
      toast.success('Archivo guardado')
    },
    onError: () => toast.error('Error al guardar archivo')
  })

  const deleteFileMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/lab-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultsFileUrl: null, resultsFileName: null })
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      toast.success('Archivo eliminado')
    },
    onError: () => toast.error('Error al eliminar archivo')
  })

  const addResultsMutation = useMutation({
    mutationFn: async ({ id, results }: { id: string; results: typeof resultsData }) => {
      const res = await fetch(`/api/lab-orders/${id}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results })
      })
      if (!res.ok) throw new Error('Failed to add results')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      setResultsDialogOpen(false)
      setSelectedOrder(null)
      setResultsData([])
      toast.success('Resultados agregados')
    },
    onError: () => toast.error('Error al agregar resultados')
  })

  const filteredOrders = orders?.filter(order => {
    const patientName = `${order.patient?.firstName} ${order.patient?.lastName}`.toLowerCase()
    return patientName.includes(searchTerm.toLowerCase())
  }) || []

  const handleTestToggle = (testName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTests: prev.selectedTests.includes(testName)
        ? prev.selectedTests.filter(t => t !== testName)
        : [...prev.selectedTests, testName]
    }))
  }

  const handleOpenResults = (order: LabOrder) => {
    setSelectedOrder(order)
    setResultsData(order.tests.map(t => ({
      testName: t.name,
      result: '',
      unit: '',
      referenceRange: '',
      flag: 'NORMAL'
    })))
    setResultsDialogOpen(true)
  }

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateMutation.mutate({ id: orderId, status: newStatus })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Órdenes de Laboratorio</h1>
          <p className="text-muted-foreground">
            Gestiona las órdenes y resultados de estudios de laboratorio
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Orden de Laboratorio</DialogTitle>
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
              <div className="space-y-2">
                <Label>Estudios a realizar</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {COMMON_LAB_TESTS.map(test => (
                    <label
                      key={test.name}
                      className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedTests.includes(test.name)}
                        onChange={() => handleTestToggle(test.name)}
                        className="rounded"
                      />
                      <span className="text-sm">{test.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Instrucciones especiales</Label>
                <Input
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Ej: En ayunas, recolectar muestra de..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.patientId || !formData.doctorId || formData.selectedTests.length === 0 || createMutation.isPending}
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
                <TableHead>Estudios</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay órdenes de laboratorio
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
                      <div className="flex flex-wrap gap-1">
                        {order.tests.slice(0, 2).map((t, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {t.name}
                          </Badge>
                        ))}
                        {order.tests.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{order.tests.length - 2} más
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(v) => handleStatusChange(order.id, v)}
                      >
                        <SelectTrigger className={`w-36 ${STATUS_COLORS[order.status].replace('bg-', 'bg-')}`}>
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
                       <div className="flex items-center justify-end gap-2">
                         {order.resultsFileUrl ? (
                           <Button
                             variant="ghost"
                             size="sm"
                             asChild
                           >
                             <a href={order.resultsFileUrl} target="_blank" rel="noopener noreferrer">
                               <FileText className="h-4 w-4 mr-1" />
                               Ver PDF
                             </a>
                           </Button>
                         ) : (
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => {
                               setUploadingOrderId(order.id)
                               setUploadDialogOpen(true)
                             }}
                           >
                             <Upload className="h-4 w-4 mr-1" />
                             Subir
                           </Button>
                         )}
                         {order.status !== 'COMPLETED' && (
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleOpenResults(order)}
                           >
                             <FileText className="h-4 w-4 mr-1" />
                             Resultados
                           </Button>
                         )}
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => setDeletingOrderId(order.id)}
                         >
                           <X className="h-4 w-4" />
                         </Button>
                       </div>
                     </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Agregar Resultados - {selectedOrder?.patient?.firstName} {selectedOrder?.patient?.lastName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {resultsData.map((result, index) => (
              <div key={index} className="grid grid-cols-5 gap-2 items-end">
                <div className="col-span-2">
                  <Label className="text-xs">Estudio</Label>
                  <Input value={result.testName} disabled className="text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Resultado</Label>
                  <Input
                    value={result.result}
                    onChange={(e) => {
                      const newData = [...resultsData]
                      newData[index].result = e.target.value
                      setResultsData(newData)
                    }}
                    placeholder="Valor"
                  />
                </div>
                <div>
                  <Label className="text-xs">Unidad</Label>
                  <Input
                    value={result.unit}
                    onChange={(e) => {
                      const newData = [...resultsData]
                      newData[index].unit = e.target.value
                      setResultsData(newData)
                    }}
                    placeholder="g/dL"
                  />
                </div>
                <div>
                  <Label className="text-xs">Rango ref.</Label>
                  <Input
                    value={result.referenceRange}
                    onChange={(e) => {
                      const newData = [...resultsData]
                      newData[index].referenceRange = e.target.value
                      setResultsData(newData)
                    }}
                    placeholder="12-16"
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultsDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => selectedOrder && addResultsMutation.mutate({ id: selectedOrder.id, results: resultsData })}
              disabled={addResultsMutation.isPending}
            >
              {addResultsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Resultados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Resultados de Laboratorio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {uploadingOrderId && (
              <FileUpload
                folder="lab-results"
                accept=".pdf,.jpg,.jpeg,.png"
                currentFile={
                  orders?.find(o => o.id === uploadingOrderId)?.resultsFileUrl
                    ? {
                        url: orders.find(o => o.id === uploadingOrderId)!.resultsFileUrl!,
                        name: orders.find(o => o.id === uploadingOrderId)!.resultsFileName || 'Archivo',
                      }
                    : undefined
                }
                onUpload={(url, fileName) => {
                  uploadFileMutation.mutate({
                    id: uploadingOrderId,
                    resultsFileUrl: url,
                    resultsFileName: fileName,
                  })
                }}
                onDelete={() => {
                  deleteFileMutation.mutate(uploadingOrderId)
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
