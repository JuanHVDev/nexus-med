'use client'
import { useState } from 'react'
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
export default function LoginPage()
{
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  const onSubmit = async (data: LoginFormData) =>
  {
    setIsLoading(true)
    try
    {
      const { data: result, error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: callbackUrl,
      })
      if (error)
      {
        toast.error(error.message || 'Error al iniciar sesión')
      } else
      {
        toast.success('¡Bienvenido!')
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error)
    {
      toast.error('Error inesperado al iniciar sesión')
    } finally
    {
      setIsLoading(false)
    }
  }
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
        <CardDescription className="text-center">
          Ingresa tus credenciales para acceder al sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="doctor@clinica.com"
              {...register('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              aria-invalid={errors.password ? 'true' : 'false'}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>¿No tienes cuenta?{' '}
            <a href="/register" className="text-primary hover:underline">
              Regístrate aquí
            </a>
          </p>
          <p className="mt-2 text-xs">
            Demo: admin@clinica.com / Admin123!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}