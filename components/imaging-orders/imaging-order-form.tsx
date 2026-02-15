'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { STUDY_TYPES } from '@/lib/validations/imaging-order'

interface ImagingOrderFormProps {
  patientId: string
  doctorId: string
  medicalNoteId: string
  onSuccess: () => void
  onCancel: () => void
}

const BODY_PARTS = [
  'Tórax',
  'Abdomen',
  'Pelvis',
  'Cráneo',
  'Columna cervical',
  'Columna dorsal',
  'Columna lumbar',
  'Extremidad superior (brazo, antebrazo, mano)',
  'Extremidad inferior (muslo, pantorrilla, pie)',
  'Cuello',
  'Corazón',
  'Hígado',
  'Riñones',
  'Vejiga',
  'Próstata',
  'Útero/Ovarios',
  'Tiroides',
  'Mama',
  'Otro',
]

export function ImagingOrderForm({ patientId, doctorId, medicalNoteId, onSuccess, onCancel }: ImagingOrderFormProps) {
  const queryClient = useQueryClient()
  const [studyType, setStudyType] = useState('')
  const [bodyPart, setBodyPart] = useState('')
  const [customBodyPart, setCustomBodyPart] = useState('')
  const [reason, setReason] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')

  const createMutation = useMutation({
    mutationFn: async (data: {
      patientId: string
      doctorId: string
      medicalNoteId: string
      studyType: string
      bodyPart: string
      reason: string | null
      clinicalNotes: string | null
    }) => {
      const response = await fetch('/api/imaging-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al crear la orden')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-orders'] })
      toast.success('Orden de imagenología creada correctamente')
      onSuccess()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!studyType) {
      toast.error('Seleccione un tipo de estudio')
      return
    }

    const finalBodyPart = bodyPart === 'Otro' ? customBodyPart : bodyPart
    
    if (!finalBodyPart) {
      toast.error('Seleccione la región corporal')
      return
    }

    if (!reason.trim()) {
      toast.error('Ingrese la razón del estudio')
      return
    }

    createMutation.mutate({
      patientId,
      doctorId,
      medicalNoteId,
      studyType,
      bodyPart: finalBodyPart,
      reason: reason || null,
      clinicalNotes: clinicalNotes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="studyType">Tipo de Estudio</Label>
          <Select value={studyType} onValueChange={setStudyType}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione el tipo de estudio" />
            </SelectTrigger>
            <SelectContent>
              {STUDY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="bodyPart">Región Corporal / Área</Label>
          <Select value={bodyPart} onValueChange={setBodyPart}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione la región" />
            </SelectTrigger>
            <SelectContent>
              {BODY_PARTS.map((part) => (
                <SelectItem key={part} value={part}>
                  {part}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {bodyPart === 'Otro' && (
            <Input
              placeholder="Especifique la región..."
              value={customBodyPart}
              onChange={(e) => setCustomBodyPart(e.target.value)}
              className="mt-2"
            />
          )}
        </div>

        <div>
          <Label htmlFor="reason">Razón del Estudio</Label>
          <Textarea
            id="reason"
            placeholder="Ej: Dolor abdominal en hipocondrio derecho..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="clinicalNotes">Notas Clínicas (Opcional)</Label>
          <Textarea
            id="clinicalNotes"
            placeholder="Sospecha diagnóstica, antecedentes relevantes..."
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createMutation.isPending || !studyType || !bodyPart}>
          {createMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4 mr-2" />
              Crear Orden
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
