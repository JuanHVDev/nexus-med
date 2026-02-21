'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authClient } from '@/lib/auth-client'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Mail, AlertCircle } from 'lucide-react'
function LoginForm()
{
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [isLoading, setIsLoading] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const handleResendVerification = async () => {
    if (!pendingEmail) return
    setResendingEmail(true)
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: pendingEmail,
        callbackURL: callbackUrl,
      })
      if (error) {
        toast.error(error.message || 'Error al reenviar el correo')
      } else {
        toast.success('Correo de verificación reenviado')
        router.push(`/verify-email-sent?email=${encodeURIComponent(pendingEmail)}`)
      }
    } catch {
      toast.error('Error inesperado al reenviar el correo')
    } finally {
      setResendingEmail(false)
    }
  }

  const onSubmit = async (data: LoginFormData) =>
  {
    setIsLoading(true)
    setNeedsVerification(false)
    try
    {
      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: callbackUrl,
      })
      if (error)
      {
        if (error.status === 403) {
          setNeedsVerification(true)
          setPendingEmail(data.email)
          toast.error('Debes verificar tu correo electrónico antes de iniciar sesión')
        } else {
          toast.error(error.message || 'Error al iniciar sesión')
        }
      } else
      {
        toast.success('¡Bienvenido!')
        router.push(callbackUrl)
        router.refresh()
      }
    } catch
    {
      toast.error('Error inesperado al iniciar sesión')
    } finally
    {
      setIsLoading(false)
    }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" type="email" placeholder="doctor@clinica.com" {...register('email')} aria-invalid={errors.email ? 'true' : 'false'} />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" type="password" {...register('password')} aria-invalid={errors.password ? 'true' : 'false'} />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>
      {needsVerification && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Correo no verificado
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Debes verificar tu correo electrónico antes de poder iniciar sesión.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
            onClick={handleResendVerification}
            disabled={resendingEmail}
          >
            {resendingEmail ? (
              'Enviando...'
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Reenviar correo de verificación
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  )
}
function LoginFormFallback()
{
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" type="email" placeholder="doctor@clinica.com" disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" type="password" disabled />
      </div>
      <Button type="submit" className="w-full" disabled>
        Cargando...
      </Button>
    </form>
  )
}
export default function LoginPage()
{
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
        <CardDescription className="text-center">
          Ingresa tus credenciales para acceder al sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>¿No tienes cuenta? <a href="/register" className="text-primary hover:underline">Regístrate aquí</a></p>
          <p className="mt-2 text-xs">Demo: admin@clinic.com / password123</p>
        </div>
      </CardContent>
    </Card>
  )
}