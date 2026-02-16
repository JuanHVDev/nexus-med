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
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, UserCog, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface Doctor {
  id: string
  name: string
  email: string
  specialty: string | null
  licenseNumber: string | null
  phone: string | null
  isActive: boolean
  createdAt: string
  _count: {
    appointments: number
    medicalNotes: number
  }
}

export default function DoctorsSettingsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    doctorId: '',
    name: '',
    specialty: '',
    licenseNumber: '',
    phone: '',
    isActive: true,
  })

  const { data, isLoading } = useQuery<{ doctors: Doctor[] }>({
    queryKey: ['settings-doctors'],
    queryFn: async () => {
      const res = await fetch('/api/settings/doctors')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/settings/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-doctors'] })
      setDialogOpen(false)
      setFormData({
        doctorId: '',
        name: '',
        specialty: '',
        licenseNumber: '',
        phone: '',
        isActive: true,
      })
      toast.success('Médico actualizado correctamente')
    },
    onError: () => {
      toast.error('Error al actualizar el médico')
    }
  })

  const handleEdit = (doctor: Doctor) => {
    setFormData({
      doctorId: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty || '',
      licenseNumber: doctor.licenseNumber || '',
      phone: doctor.phone || '',
      isActive: doctor.isActive,
    })
    setDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const doctors = data?.doctors || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Médicos de la Clínica</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona la información de los médicos colaboradores
          </p>
        </div>
        <Button onClick={() => handleEdit(doctors[0])} variant="outline">
          <UserCog className="h-4 w-4 mr-2" />
          Editar Médicos
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Médicos</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Médicos Activos</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctors.filter(d => d.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Totales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {doctors.reduce((sum, d) => sum + d._count.medicalNotes, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Médico</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Consultas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay médicos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  doctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell className="font-medium">{doctor.name}</TableCell>
                      <TableCell>{doctor.specialty || '-'}</TableCell>
                      <TableCell>{doctor.licenseNumber || '-'}</TableCell>
                      <TableCell>{doctor.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {doctor._count.medicalNotes}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={doctor.isActive ? 'default' : 'secondary'}>
                          {doctor.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(doctor)}>
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) {
          setFormData({
            doctorId: '',
            name: '',
            specialty: '',
            licenseNumber: '',
            phone: '',
            isActive: true,
          })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Médico</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Seleccionar Médico</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.doctorId}
                onChange={(e) => {
                  const doctor = doctors.find(d => d.id === e.target.value)
                  setFormData({
                    ...formData,
                    doctorId: e.target.value,
                    name: doctor?.name || '',
                    specialty: doctor?.specialty || '',
                    licenseNumber: doctor?.licenseNumber || '',
                    phone: doctor?.phone || '',
                    isActive: doctor?.isActive ?? true,
                  })
                }}
              >
                <option value="">Seleccionar...</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="Medicina General"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">Cédula Profesional</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive" className="font-normal">Médico activo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !formData.doctorId}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
