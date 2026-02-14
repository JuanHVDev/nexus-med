'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authClient } from '@/lib/auth-client'
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
const ROLES = [
  { value: 'DOCTOR', label: 'Médico' },
  { value: 'NURSE', label: 'Enfermera(o)' },
  { value: 'RECEPTIONIST', label: 'Recepcionista' },
]
export default function RegisterPage()
{
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'DOCTOR',
      clinicId: '1', // Hardcodeado por ahora, idealmente vendría de un select
      licenseNumber: '',
      specialty: '',
      phone: '',
    },
  })
  const selectedRole = watch('role')
  const onSubmit = async (data: RegisterFormData) =>
  {
    setIsLoading(true)
    try
    {
      const { data: result, error } = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        clinicId: parseInt(data.clinicId),
        licenseNumber: data.licenseNumber || undefined,
        specialty: data.specialty || undefined,
        phone: data.phone || undefined,
        callbackURL: '/dashboard',
      })
      if (error)
      {
        toast.error(error.message || 'Error al registrarse')
      } else
      {
        toast.success('¡Registro exitoso! Bienvenido.')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error)
    {
      toast.error('Error inesperado al registrarse')
    } finally
    {
      setIsLoading(false)
    }
  }
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
        <CardDescription className="text-center">
          Regístrate para acceder al sistema de historia clínica
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              placeholder="Dr. Juan Pérez"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="doctor@clinica.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={selectedRole}
              onValueChange={(value: string) => setValue('role', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">Cédula profesional</Label>
            <Input
              id="licenseNumber"
              placeholder="1234567"
              {...register('licenseNumber')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialty">Especialidad</Label>
            <Input
              id="specialty"
              placeholder="Medicina General"
              {...register('specialty')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              placeholder="555-123-4567"
              {...register('phone')}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Registrando...' : 'Crear Cuenta'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-primary hover:underline">
            Inicia sesión aquí
          </a>
        </div>
      </CardContent>
    </Card>
  )
}