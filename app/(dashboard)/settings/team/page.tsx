'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, UserPlus, Mail, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

interface Member {
  id: string
  userId: string
  name: string
  email: string
  role: string
  specialty: string | null
  licenseNumber: string | null
  phone: string | null
  isActive: boolean
  joinedAt: string
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  token: string
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
}

interface ClinicInfo {
  id: string
  name: string
  role: string
}

const ROLES = [
  { value: 'DOCTOR', label: 'Médico' },
  { value: 'NURSE', label: 'Enfermero/a' },
  { value: 'RECEPTIONIST', label: 'Recepcionista' },
]

export default function TeamPage() {
  const queryClient = useQueryClient()
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'DOCTOR',
  })

  // Obtener información de la clínica
  const { data: clinicData } = useQuery<ClinicInfo>({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/clinic')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const clinicId = clinicData?.id
  const isAdmin = clinicData?.role === 'ADMIN'

  // Obtener miembros
  const { data: membersData, isLoading: loadingMembers } = useQuery<{ members: Member[] }>({
    queryKey: ['clinic-members', clinicId],
    queryFn: async () => {
      if (!clinicId) return { members: [] }
      const res = await fetch(`/api/clinics/${clinicId}/members`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !!clinicId,
  })

  // Obtener invitaciones
  const { data: invitationsData, isLoading: loadingInvitations } = useQuery<{ invitations: Invitation[] }>({
    queryKey: ['clinic-invitations'],
    queryFn: async () => {
      const res = await fetch('/api/invitations')
      if (!res.ok) return { invitations: [] }
      return res.json()
    },
    enabled: isAdmin,
  })

  // Enviar invitación
  const inviteMutation = useMutation({
    mutationFn: async (data: typeof inviteForm) => {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to send invitation')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-invitations'] })
      setInviteDialogOpen(false)
      setInviteForm({ email: '', role: 'DOCTOR' })
      toast.success('Invitación enviada correctamente')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al enviar invitación')
    },
  })

  // Eliminar miembro
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/clinics/${clinicId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to remove member')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-members'] })
      toast.success('Miembro eliminado correctamente')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar miembro')
    },
  })

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    inviteMutation.mutate(inviteForm)
  }

  const getRoleLabel = (role: string) => {
    return ROLES.find(r => r.value === role)?.label || role
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pendiente</Badge>
      case 'ACCEPTED':
        return <Badge variant="default">Aceptada</Badge>
      case 'EXPIRED':
        return <Badge variant="destructive">Expirada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const members = membersData?.members || []
  const invitations = invitationsData?.invitations || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Equipo</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona los miembros de tu clínica
          </p>
        </div>
        {isAdmin && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invitar Miembro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@email.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  El invitado recibirá un email con instrucciones para unirse a la clínica.
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Enviar Invitación
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Miembros ({members.length})
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="invitations">
              <Mail className="h-4 w-4 mr-2" />
              Invitaciones ({invitations.filter(i => i.status === 'PENDING').length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loadingMembers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hay miembros en la clínica
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Especialidad</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Estado</TableHead>
                      {isAdmin && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getRoleLabel(member.role)}</Badge>
                        </TableCell>
                        <TableCell>{member.specialty || '-'}</TableCell>
                        <TableCell>{member.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={member.isActive ? 'default' : 'secondary'}>
                            {member.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            {member.role !== 'ADMIN' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm('¿Estás seguro de eliminar este miembro?')) {
                                    removeMemberMutation.mutate(member.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="invitations" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {loadingInvitations ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay invitaciones enviadas
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Expira</TableHead>
                        <TableHead>Enviada</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">{invitation.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getRoleLabel(invitation.role)}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                          <TableCell>
                            {new Date(invitation.expiresAt).toLocaleDateString('es-MX')}
                          </TableCell>
                          <TableCell>
                            {new Date(invitation.createdAt).toLocaleDateString('es-MX')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
