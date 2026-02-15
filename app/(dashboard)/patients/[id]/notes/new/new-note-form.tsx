'use client'

import { useRouter } from 'next/navigation'
import { MedicalNoteForm } from '@/components/medical-notes/medical-note-form'
import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { MedicalNoteInputFormData } from '@/lib/validations/medical-note'

interface Patient {
  id: string
  firstName: string
  lastName: string
  middleName?: string
}

interface Appointment {
  id: string
  startTime: string
  reason?: string
}

interface NewMedicalNoteFormProps {
  patient: Patient
  appointment?: Appointment | null
  isEditMode?: boolean
  noteId?: string
}

export function NewMedicalNoteForm({ patient, appointment, isEditMode = false, noteId }: NewMedicalNoteFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: MedicalNoteInputFormData) => {
      const res = await fetch('/api/medical-notes', {
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
      queryClient.invalidateQueries({ queryKey: ['medical-notes'] })
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Nota médica creada correctamente')
      router.push(`/patients/${patient.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la nota médica')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (data: MedicalNoteInputFormData) => {
      const res = await fetch(`/api/medical-notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to update')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-notes'] })
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Nota médica actualizada correctamente')
      router.push(`/patients/${patient.id}/notes/${noteId}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar la nota médica')
    }
  })

  const handleSubmit = async (data: MedicalNoteInputFormData) => {
    if (isEditMode && noteId) {
      await updateMutation.mutateAsync(data)
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  return (
    <MedicalNoteForm
      patient={patient}
      appointment={appointment}
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending || updateMutation.isPending}
      onCancel={() => router.push(isEditMode ? `/patients/${patient.id}/notes/${noteId}` : `/patients/${patient.id}`)}
      isEditMode={isEditMode}
      noteId={noteId}
    />
  )
}
