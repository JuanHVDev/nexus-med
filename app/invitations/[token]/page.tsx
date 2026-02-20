'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function AcceptInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [invitation, setInvitation] = useState<{
    email: string
    role: string
    clinicName: string
    status: string
    expiresAt: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [existingUser, setExistingUser] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    const checkInvitation = async () => {
      try {
        const res = await fetch(`/api/invitations/${token}/check`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Error al verificar invitación')
          return
        }

        setInvitation(data.invitation)
        setExistingUser(data.existingUser || false)

        if (data.existingUser) {
          // Si ya existe el usuario, auto-aceptar
          const acceptRes = await fetch(`/api/invitations/${token}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })
          if (acceptRes.ok) {
            toast.success('¡Te has unido a la clínica exitosamente!')
            router.push('/login')
          }
        }
      } catch {
        setError('Error al verificar invitación')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      checkInvitation()
    }
  }, [token, router])

  const handleAccept = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!existingUser && formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (!existingUser && formData.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al aceptar invitación')
        return
      }

      toast.success('¡Te has unido a la clínica exitosamente!')
      router.push('/login')
    } catch {
      setError('Error al aceptar invitación')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/login')}>
              Ir a Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (existingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <CardTitle>Uniéndote a la clínica...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>¡Has sido invitado!</CardTitle>
          <CardDescription>
            Te han invitado a unirte a <strong>{invitation?.clinicName}</strong> como{' '}
            <strong>{invitation?.role === 'DOCTOR' ? 'Médico' : invitation?.role === 'NURSE' ? 'Enfermero/a' : 'Recepcionista'}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAccept} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.email || ''}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo *</Label>
              <Input
                id="name"
                placeholder="Dr. Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Unirme a la Clínica
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-primary hover:underline">
              Inicia sesión
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
