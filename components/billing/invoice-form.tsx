'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { invoiceInputSchema, type InvoiceInputFormData } from '@/lib/validations/invoice'

interface Service {
  id: string
  name: string
  description: string | null
  basePrice: number
  category: {
    id: string
    name: string
  } | null
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

interface InvoiceFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function InvoiceForm({ onSuccess, onCancel }: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const { register, control, handleSubmit, watch, reset } = useForm<InvoiceInputFormData>({
    resolver: zodResolver(invoiceInputSchema),
    defaultValues: {
      items: [{ description: '', quantity: 1, unitPrice: 0, discount: 0 }],
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchItems = watch('items')

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => setServices(data.services || []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (patientSearch.length >= 2) {
      fetch(`/api/patients?search=${patientSearch}&limit=10`)
        .then(res => res.json())
        .then(data => setPatients(data.data || []))
        .catch(console.error)
    }
  }, [patientSearch])

  const addServiceToItems = (service: Service) => {
    append({
      serviceId: service.id,
      description: service.name,
      quantity: 1,
      unitPrice: service.basePrice,
      discount: 0
    })
  }

  const calculateSubtotal = () => {
    return watchItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice) - item.discount
    }, 0)
  }

  const onSubmit = async (data: InvoiceInputFormData) => {
    if (!selectedPatient) {
      toast.error('Selecciona un paciente')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          patientId: selectedPatient.id,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al crear factura')
      }

      toast.success('Factura creada correctamente')
      reset()
      setSelectedPatient(null)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear factura')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del Paciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Buscar Paciente</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o CURP..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {patients.length > 0 && (
              <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                {patients.map(patient => (
                  <button
                    key={patient.id}
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b last:border-b-0"
                    onClick={() => {
                      setSelectedPatient(patient)
                      setPatientSearch('')
                      setPatients([])
                    }}
                  >
                    {patient.firstName} {patient.lastName}
                  </button>
                ))}
              </div>
            )}
            {selectedPatient && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                <span className="font-medium">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedPatient(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services/Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Servicios</CardTitle>
          <div className="flex gap-2">
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              onChange={(e) => {
                const service = services.find(s => s.id === e.target.value)
                if (service) {
                  addServiceToItems(service)
                  e.target.value = ''
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>Agregar servicio...</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.basePrice}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <Label className="text-sm font-medium">Item {index + 1}</Label>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => remove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-3">
                  <Label htmlFor={`items.${index}.description`}>Descripción</Label>
                  <Input
                    id={`items.${index}.description`}
                    {...register(`items.${index}.description`)}
                    placeholder="Descripción del servicio"
                  />
                </div>

                <div>
                  <Label htmlFor={`items.${index}.quantity`}>Cantidad</Label>
                  <Input
                    id={`items.${index}.quantity`}
                    type="number"
                    min={1}
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <Label htmlFor={`items.${index}.unitPrice`}>Precio Unit.</Label>
                  <Input
                    id={`items.${index}.unitPrice`}
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <Label htmlFor={`items.${index}.discount`}>Descuento</Label>
                  <Input
                    id={`items.${index}.discount`}
                    type="number"
                    step="0.01"
                    defaultValue={0}
                    {...register(`items.${index}.discount`, { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="text-right text-sm font-medium">
                Subtotal: ${((watchItems[index]?.quantity || 0) * (watchItems[index]?.unitPrice || 0) - (watchItems[index]?.discount || 0)).toFixed(2)}
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ description: '', quantity: 1, unitPrice: 0, discount: 0 })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Item
          </Button>

          <div className="border-t pt-4">
            <div className="flex justify-end gap-8 text-lg">
              <span className="font-medium">Total:</span>
              <span className="font-bold">${calculateSubtotal().toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Notas adicionales para la factura..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !selectedPatient}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Factura
        </Button>
      </div>
    </form>
  )
}
