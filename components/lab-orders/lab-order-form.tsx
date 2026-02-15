'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Plus, X, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'

const COMMON_LAB_TESTS = [
  { name: 'Biometría hemática completa', code: 'BHC' },
  { name: 'Química sanguínea (6 elementos)', code: 'QS6' },
  { name: 'Química sanguínea completa (12 elementos)', code: 'QS12' },
  { name: 'Análisis de orina', code: 'EO' },
  { name: 'Perfil lipídico', code: 'PL' },
  { name: 'Pruebas de función tiroidea (T3, T4, TSH)', code: 'T3T4TSH' },
  { name: 'Glucosa en sangre', code: 'GLU' },
  { name: 'Hemoglobina glicosilada', code: 'HbA1c' },
  { name: 'Examen general de heces', code: 'EGH' },
  { name: 'Tiempo de protrombina', code: 'TP' },
  { name: 'Tiempo de tromboplastina parcial', code: 'TTP' },
  { name: 'Perfil hepático', code: 'PH' },
  { name: 'Perfil renal', code: 'PR' },
  { name: 'Electrolitos séricos', code: 'EL' },
  { name: 'Velocidad de sedimentación globular', code: 'VSG' },
  { name: 'Proteína C reactiva', code: 'PCR' },
]

interface LabOrderFormProps {
  patientId: string
  doctorId: string
  medicalNoteId: string
  onSuccess: () => void
  onCancel: () => void
}

export function LabOrderForm({ patientId, doctorId, medicalNoteId, onSuccess, onCancel }: LabOrderFormProps) {
  const queryClient = useQueryClient()
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [customTest, setCustomTest] = useState('')
  const [instructions, setInstructions] = useState('')

  const createMutation = useMutation({
    mutationFn: async (data: { patientId: string; doctorId: string; medicalNoteId: string; tests: { name: string; code?: string }[]; instructions: string | null }) => {
      const response = await fetch('/api/lab-orders', {
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
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      toast.success('Orden de laboratorio creada correctamente')
      onSuccess()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const toggleTest = (testName: string) => {
    setSelectedTests(prev => 
      prev.includes(testName) 
        ? prev.filter(t => t !== testName)
        : [...prev, testName]
    )
  }

  const addCustomTest = () => {
    if (customTest.trim() && !selectedTests.includes(customTest.trim())) {
      setSelectedTests(prev => [...prev, customTest.trim()])
      setCustomTest('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedTests.length === 0) {
      toast.error('Seleccione al menos un estudio')
      return
    }

    const tests = selectedTests.map(name => {
      const predefined = COMMON_LAB_TESTS.find(t => t.name === name)
      return {
        name,
        code: predefined?.code,
      }
    })

    createMutation.mutate({
      patientId,
      doctorId,
      medicalNoteId,
      tests,
      instructions: instructions || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Estudios de Laboratorio</Label>
          <p className="text-sm text-muted-foreground mb-3">Seleccione los estudios a realizar</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-md p-3">
            {COMMON_LAB_TESTS.map((test) => (
              <div key={test.code} className="flex items-center space-x-2">
                <Checkbox
                  id={test.code}
                  checked={selectedTests.includes(test.name)}
                  onCheckedChange={() => toggleTest(test.name)}
                />
                <Label htmlFor={test.code} className="text-sm font-normal cursor-pointer">
                  {test.name}
                  {test.code && <span className="text-muted-foreground ml-1">({test.code})</span>}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {selectedTests.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Estudios seleccionados:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTests.map((test) => (
                <div
                  key={test}
                  className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                >
                  <span>{test}</span>
                  <button
                    type="button"
                    onClick={() => toggleTest(test)}
                    className="hover:bg-primary/20 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Agregar estudio personalizado..."
              value={customTest}
              onChange={(e) => setCustomTest(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTest())}
            />
          </div>
          <Button type="button" variant="outline" onClick={addCustomTest}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div>
          <Label htmlFor="instructions">Instrucciones para el paciente</Label>
          <Textarea
            id="instructions"
            placeholder="Ej: Presentarse en ayunas de 8 horas..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createMutation.isPending || selectedTests.length === 0}>
          {createMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <FlaskConical className="h-4 w-4 mr-2" />
              Crear Orden
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
