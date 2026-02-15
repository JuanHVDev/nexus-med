'use client'

import { useRouter } from 'next/navigation'
import { AppointmentForm } from '@/components/appointments/appointment-form'
import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AppointmentInputFormData } from '@/lib/validations/appointment'

export default function NewAppointmentPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: AppointmentInputFormData) => {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to create')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Cita creada correctamente')
      router.push('/appointments')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la cita')
    }
  })

  const handleSubmit = async (data: AppointmentInputFormData) => {
    await createMutation.mutateAsync(data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Cita</h1>
        <p className="text-muted-foreground">
          Programar una nueva cita médica
        </p>
      </div>

      <div className="max-w-2xl">
        <AppointmentForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          onCancel={() => router.push('/appointments')}
        />
      </div>
    </div>
  )
}
