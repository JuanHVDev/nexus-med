'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  FolderOpen,
  Stethoscope,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'

interface ServiceItem {
  id: string
  name: string
  description: string | null
  basePrice: number
  duration: number | null
  isActive: boolean
  categoryId: string | null
  category?: {
    id: string
    name: string
    color?: string | null
  } | null
}

interface ServiceCategory {
  id: string
  name: string
  description: string | null
  color: string | null
  sortOrder: number
  isActive: boolean
  services?: ServiceItem[]
}

export default function ServicesPage() {
  const queryClient = useQueryClient()
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceItem | null>(null)
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null)

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  })

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    basePrice: 0,
    duration: '',
    categoryId: '',
    isActive: true,
  })

  const { data, isLoading } = useQuery<{ categories: ServiceCategory[]; services: ServiceItem[] }>({
    queryKey: ['services-catalog'],
    queryFn: async () => {
      const res = await fetch('/api/services')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryForm) => {
      const res = await fetch('/api/services/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] })
      setCategoryDialogOpen(false)
      setCategoryForm({ name: '', description: '', color: '#3b82f6' })
      toast.success('Categoría creada')
    },
    onError: () => toast.error('Error al crear categoría')
  })

  const createServiceMutation = useMutation({
    mutationFn: async (data: typeof serviceForm) => {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        basePrice: data.basePrice,
        duration: data.duration ? parseInt(data.duration) : undefined,
        categoryId: data.categoryId || undefined,
        isActive: data.isActive,
      }
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] })
      setServiceDialogOpen(false)
      setServiceForm({ name: '', description: '', basePrice: 0, duration: '', categoryId: '', isActive: true })
      toast.success('Servicio creado')
    },
    onError: () => toast.error('Error al crear servicio')
  })

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] })
      toast.success('Servicio eliminado')
    },
    onError: () => toast.error('Error al eliminar servicio')
  })

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof serviceForm }) => {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        basePrice: data.basePrice,
        duration: data.duration ? parseInt(data.duration) : undefined,
        categoryId: data.categoryId || undefined,
        isActive: data.isActive,
      }
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] })
      setServiceDialogOpen(false)
      setEditingService(null)
      setServiceForm({ name: '', description: '', basePrice: 0, duration: '', categoryId: '', isActive: true })
      toast.success('Servicio actualizado')
    },
    onError: () => toast.error('Error al actualizar servicio')
  })

  const categories = data?.categories || []
  const services = data?.services || []

  const handleEditService = (service: ServiceItem) => {
    setEditingService(service)
    setServiceForm({
      name: service.name,
      description: service.description || '',
      basePrice: service.basePrice,
      duration: service.duration?.toString() || '',
      categoryId: service.categoryId || '',
      isActive: service.isActive,
    })
    setServiceDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setDeletingServiceId(id)
  }

  const handleConfirmDelete = () => {
    if (deletingServiceId) {
      deleteServiceMutation.mutate(deletingServiceId)
      setDeletingServiceId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Servicios</h1>
          <p className="text-muted-foreground">
            Administra los servicios y precios de la clínica
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios Activos</CardTitle>
            <Badge variant="secondary" className="h-4 w-4 p-0">✓</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.filter(s => s.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${services.length > 0 
                ? (services.reduce((sum, s) => sum + s.basePrice, 0) / services.length).toFixed(2)
                : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Categoría</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="ej: Consultas"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Descripción opcional"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="h-10 w-10 rounded border"
                  />
                  <Input
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createCategoryMutation.mutate(categoryForm)}
                disabled={!categoryForm.name || createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre del Servicio</Label>
                <Input
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="ej: Consulta de primera vez"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Descripción opcional"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio Base</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={serviceForm.basePrice}
                    onChange={(e) => setServiceForm({ ...serviceForm, basePrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duración (minutos)</Label>
                  <Input
                    type="number"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={serviceForm.categoryId}
                  onChange={(e) => setServiceForm({ ...serviceForm, categoryId: e.target.value })}
                >
                  <option value="">Sin categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setServiceDialogOpen(false)
                setEditingService(null)
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (editingService) {
                    updateServiceMutation.mutate({ id: editingService.id, data: serviceForm })
                  } else {
                    createServiceMutation.mutate(serviceForm)
                  }
                }}
                disabled={!serviceForm.name || createServiceMutation.isPending || updateServiceMutation.isPending}
              >
                {(createServiceMutation.isPending || updateServiceMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingService ? 'Guardar' : 'Crear'}
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
                <TableHead>Servicio</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Duración</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay servicios registrados
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      {service.name}
                      {service.description && (
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {service.category ? (
                        <Badge variant="outline">
                          {service.category.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">${service.basePrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {service.duration ? `${service.duration} min` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.isActive ? 'default' : 'secondary'}>
                        {service.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditService(service)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(service.id)}>
                          <Trash2 className="h-4 w-4" />
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

      <AlertDialog open={!!deletingServiceId} onOpenChange={(open) => !open && setDeletingServiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El servicio será eliminado permanentemente del catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
