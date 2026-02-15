'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { type Medication } from '@/lib/validations/prescription'

interface PrescriptionFormProps {
  patientId: string
  medicalNoteId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function PrescriptionForm({ patientId, medicalNoteId, onSuccess, onCancel }: PrescriptionFormProps) {
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', route: 'ORAL', frequency: '', duration: '', instructions: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', route: 'ORAL', frequency: '', duration: '', instructions: '' }])
  }

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index))
    }
  }

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications]
    updated[index] = { ...updated[index], [field]: value }
    setMedications(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validar medicamentos
      const validMedications = medications.filter(m => m.name && m.dosage && m.route)
      if (validMedications.length === 0) {
        toast.error('Agrega al menos un medicamento')
        return
      }

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          medicalNoteId,
          medications: validMedications,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al crear receta')
      }

      toast.success('Receta creada correctamente')
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear receta')
    } finally {
      setIsSubmitting(false)
    }
  }

  const routeOptions = [
    { value: 'ORAL', label: 'Oral' },
    { value: 'INTRAVENOUS', label: 'Intravenosa' },
    { value: 'INTRAMUSCULAR', label: 'Intramuscular' },
    { value: 'SUBCUTANEOUS', label: 'Subcutánea' },
    { value: 'TOPICAL', label: 'Tópica' },
    { value: 'INHALED', label: 'Inhalada' },
    { value: 'SUBLINGUAL', label: 'Sublingual' },
    { value: 'RECTAL', label: 'Rectal' },
    { value: 'OPHTHALMIC', label: 'Oftálmica' },
    { value: 'OTIC', label: 'Ótica' },
    { value: 'NASAL', label: 'Nasal' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Medicamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {medications.map((med, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3 relative">
              {medications.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeMedication(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`med-name-${index}`}>Medicamento *</Label>
                  <Input
                    id={`med-name-${index}`}
                    value={med.name}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    placeholder="Nombre del medicamento"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`med-dosage-${index}`}>Dosis *</Label>
                  <Input
                    id={`med-dosage-${index}`}
                    value={med.dosage}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    placeholder="ej: 500mg"
                  />
                </div>

                <div>
                  <Label htmlFor={`med-route-${index}`}>Vía de administración *</Label>
                  <select
                    id={`med-route-${index}`}
                    value={med.route}
                    onChange={(e) => updateMedication(index, 'route', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {routeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor={`med-frequency-${index}`}>Frecuencia</Label>
                  <Input
                    id={`med-frequency-${index}`}
                    value={med.frequency || ''}
                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    placeholder="ej: cada 8 horas"
                  />
                </div>

                <div>
                  <Label htmlFor={`med-duration-${index}`}>Duración</Label>
                  <Input
                    id={`med-duration-${index}`}
                    value={med.duration || ''}
                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                    placeholder="ej: 7 días"
                  />
                </div>

                <div>
                  <Label htmlFor={`med-instructions-${index}`}>Instrucciones</Label>
                  <Input
                    id={`med-instructions-${index}`}
                    value={med.instructions || ''}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    placeholder="ej: tomar con alimentos"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addMedication}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar medicamento
          </Button>
        </CardContent>
      </Card>

      <div>
        <Label htmlFor="instructions">Instrucciones generales</Label>
        <Textarea
          id="instructions"
          placeholder="Instrucciones adicionales para el paciente..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Receta
        </Button>
      </div>
    </form>
  )
}
