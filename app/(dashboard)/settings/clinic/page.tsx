'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

interface Clinic {
  id: string
  name: string
  rfc: string
  address: string | null
  phone: string | null
  email: string | null
  isActive: boolean
}

export default function ClinicSettingsPage() {
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)

  const { data: clinic, isLoading } = useQuery<Clinic>({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/clinic')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Clinic>) => {
      setIsSaving(true)
      const res = await fetch('/api/settings/clinic', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] })
      toast.success('Configuración guardada correctamente')
    },
    onError: () => {
      toast.error('Error al guardar la configuración')
    },
    onSettled: () => {
      setIsSaving(false)
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    updateMutation.mutate({
      name: formData.get('name') as string,
      rfc: formData.get('rfc') as string,
      address: formData.get('address') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      email: formData.get('email') as string || undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Información de la Clínica</CardTitle>
          <CardDescription>
            Actualiza los datos generales de tu clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Clínica *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={clinic?.name}
                  placeholder="Clínica Santa María"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rfc">RFC *</Label>
                <Input
                  id="rfc"
                  name="rfc"
                  defaultValue={clinic?.rfc}
                  placeholder="XAXX010101000"
                  maxLength={13}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                name="address"
                defaultValue={clinic?.address || ''}
                placeholder="Av. Principal #123, Col. Centro"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono Fijo</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={clinic?.phone || ''}
                  placeholder="55 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={clinic?.email || ''}
                  placeholder="contacto@clinica.com"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
