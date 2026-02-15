'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Receipt, Plus, Trash2 } from 'lucide-react'

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

interface InvoiceItem {
  id: string
  serviceId: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
}

interface GenerateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  medicalNoteId: string
  patientId: string
  patientName: string
  doctorName: string
  onSuccess?: (invoiceId: string) => void
}

export function GenerateInvoiceDialog({
  open,
  onOpenChange,
  medicalNoteId,
  patientId,
  patientName,
  doctorName,
  onSuccess
}: GenerateInvoiceDialogProps) {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', serviceId: '', description: '', quantity: 1, unitPrice: 0, discount: 0 }
  ])

  useEffect(() => {
    if (open) {
      fetchServices()
    }
  }, [open])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    } catch (err) {
      console.error('Error fetching services:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleServiceSelect = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      const newItems = [...items]
      newItems[index] = {
        ...newItems[index],
        serviceId,
        description: service.name,
        unitPrice: service.basePrice
      }
      setItems(newItems)
    }
  }

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), serviceId: '', description: '', quantity: 1, unitPrice: 0, discount: 0 }
    ])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice) - item.discount
    }, 0)
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      setError(null)

      const validItems = items.filter(item => item.description && item.quantity > 0)
      
      if (validItems.length === 0) {
        setError('Agregue al menos un servicio')
        return
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          notes: `Nota médica: ${medicalNoteId}\nDoctor: ${doctorName}`,
          items: validItems.map(item => ({
            serviceId: item.serviceId || undefined,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount
          }))
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Error al crear factura')
      }

      const invoice = await response.json()
      onOpenChange(false)
      onSuccess?.(invoice.id)
      router.push('/billing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear factura')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Generar Factura
          </DialogTitle>
          <DialogDescription>
            Paciente: {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Servicios</Label>
                {items.map((item, index) => (
                  <div key={item.id} className="flex gap-2 items-end p-3 border rounded-lg">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Servicio</Label>
                      <Select
                        value={item.serviceId}
                        onValueChange={(value) => handleServiceSelect(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar servicio..." />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map(service => (
                            <SelectItem key={service.id} value={service.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{service.name}</span>
                                <Badge variant="secondary" className="ml-2">
                                  ${service.basePrice.toFixed(2)}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">Precio</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-xs">Descuento</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.discount}
                        onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Servicio
                </Button>
              </div>

              <div className="flex justify-end text-lg font-semibold">
                Total: ${calculateTotal().toFixed(2)}
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Factura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
