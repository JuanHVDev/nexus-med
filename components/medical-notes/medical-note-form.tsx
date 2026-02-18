'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  medicalNoteInputSchema, 
  specialties, 
  specialtyLabels,
  templateFields,
  type MedicalNoteInputFormData
} from '@/lib/validations/medical-note'

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

interface MedicalNoteFormProps {
  patient: Patient
  appointment?: Appointment | null
  onSubmit: (data: MedicalNoteInputFormData) => Promise<void>
  isLoading?: boolean
  onCancel?: () => void
  defaultValues?: Partial<MedicalNoteInputFormData>
  isEditMode?: boolean
  noteId?: string
}

export function MedicalNoteForm({ 
  patient, 
  appointment,
  onSubmit, 
  isLoading, 
  onCancel,
  defaultValues,
  isEditMode = false,
  noteId
}: MedicalNoteFormProps) {
  const [, setSelectedSpecialty] = useState<string>(defaultValues?.specialty || 'GENERAL')
  const [localVitalSigns, setLocalVitalSigns] = useState<{
    bloodPressureSystolic?: number
    bloodPressureDiastolic?: number
    heartRate?: number
    temperature?: number
    weight?: number
    height?: number
    oxygenSaturation?: number
    respiratoryRate?: number
  }>(defaultValues?.vitalSigns || {})

  const form = useForm<MedicalNoteInputFormData>({
    resolver: zodResolver(medicalNoteInputSchema),
    defaultValues: {
      patientId: patient.id,
      appointmentId: appointment?.id || defaultValues?.appointmentId || '',
      specialty: defaultValues?.specialty || 'GENERAL',
      type: defaultValues?.type || 'CONSULTATION',
      chiefComplaint: defaultValues?.chiefComplaint || appointment?.reason || '',
      currentIllness: defaultValues?.currentIllness || '',
      physicalExam: defaultValues?.physicalExam || '',
      diagnosis: defaultValues?.diagnosis || '',
      prognosis: defaultValues?.prognosis || '',
      treatment: defaultValues?.treatment || '',
      notes: defaultValues?.notes || '',
      vitalSigns: defaultValues?.vitalSigns || { bloodPressureSystolic: undefined, bloodPressureDiastolic: undefined, heartRate: undefined, temperature: undefined, weight: undefined, height: undefined, oxygenSaturation: undefined, respiratoryRate: undefined },
    },
  })

  useEffect(() => {
    if (isEditMode && noteId) {
      async function fetchNote() {
        try {
          console.log('Fetching note:', noteId)
          const res = await fetch(`/api/medical-notes/${noteId}`)
          console.log('Response status:', res.status)
          if (res.ok) {
            const note = await res.json()
            console.log('Note data received:', note)
            form.reset({
              patientId: note.patientId,
              appointmentId: note.appointmentId || '',
              specialty: note.specialty || 'GENERAL',
              type: note.type || 'CONSULTATION',
              chiefComplaint: note.chiefComplaint || '',
              currentIllness: note.currentIllness || '',
              physicalExam: note.physicalExam || '',
              diagnosis: note.diagnosis || '',
              prognosis: note.prognosis || '',
              treatment: note.treatment || '',
              notes: note.notes || '',
            })
            if (note.vitalSigns) {
              const parsedVitalSigns = typeof note.vitalSigns === 'string' 
                ? JSON.parse(note.vitalSigns) 
                : note.vitalSigns
              setLocalVitalSigns(parsedVitalSigns)
              setSelectedSpecialty(note.specialty || 'GENERAL')
            }
          }
        } catch (error) {
          console.error('Error fetching note:', error)
        }
      }
      fetchNote()
    }
  }, [isEditMode, noteId, form])

  const handleSpecialtyChange = (value: string) => {
    setSelectedSpecialty(value)
    form.setValue('specialty', value as typeof specialties[number])
    
    const template = templateFields[value as keyof typeof templateFields]
    if (template && !form.getValues('physicalExam')) {
      form.setValue('physicalExam', template.requiredPhysicalExam.join('\n') + '\n\n')
    }
  }

  const handleSubmit = async (data: MedicalNoteInputFormData) => {
    const dataWithVitalSigns = {
      ...data,
      vitalSigns: localVitalSigns
    }
    try {
      await onSubmit(dataWithVitalSigns)
      toast.success('Nota médica guardada correctamente')
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error('Error al guardar la nota médica')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="specialty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especialidad</FormLabel>
                <Select 
                  onValueChange={handleSpecialtyChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger id="specialty">
                      <SelectValue placeholder="Seleccionar especialidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {specialties.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {specialtyLabels[spec]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Nota</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CONSULTATION">Consulta</SelectItem>
                    <SelectItem value="FOLLOWUP">Seguimiento</SelectItem>
                    <SelectItem value="EMERGENCY">Emergencia</SelectItem>
                    <SelectItem value="PROCEDURE">Procedimiento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Tabs defaultValue="complaint" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="complaint">Motivo</TabsTrigger>
            <TabsTrigger value="examination">Exploración</TabsTrigger>
            <TabsTrigger value="diagnosis">Diagnóstico</TabsTrigger>
            <TabsTrigger value="treatment">Tratamiento</TabsTrigger>
          </TabsList>

          <TabsContent value="complaint" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Motivo de Consulta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="chiefComplaint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo de consulta *</FormLabel>
                      <FormControl>
                        <Textarea 
                          id="chiefComplaint"
                          placeholder="Descripción del motivo de consulta..." 
                          {...field} 
                          value={field.value ?? ''}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentIllness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Padecimiento actual</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Historia del padecimiento actual..." 
                          {...field} 
                          value={field.value ?? ''}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examination" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Signos Vitales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>PA Sistólica (mmHg)</Label>
                    <Input 
                      type="number" 
                      placeholder="120"
                      value={localVitalSigns.bloodPressureSystolic ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined
                        setLocalVitalSigns(prev => ({ ...prev, bloodPressureSystolic: value }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PA Diastólica (mmHg)</Label>
                    <Input 
                      type="number" 
                      placeholder="80"
                      value={localVitalSigns.bloodPressureDiastolic ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined
                        setLocalVitalSigns(prev => ({ ...prev, bloodPressureDiastolic: value }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frecuencia Cardiaca (lpm)</Label>
                    <Input 
                      type="number" 
                      placeholder="72"
                      value={localVitalSigns.heartRate ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined
                        setLocalVitalSigns(prev => ({ ...prev, heartRate: value }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Temperatura (°C)</Label>
                    <Input 
                      type="number" 
                      step="0.1"
                      placeholder="36.5"
                      value={localVitalSigns.temperature ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined
                        setLocalVitalSigns(prev => ({ ...prev, temperature: value }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso (kg)</Label>
                    <Input 
                      type="number" 
                      step="0.1"
                      placeholder="70"
                      value={localVitalSigns.weight ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined
                        setLocalVitalSigns(prev => ({ ...prev, weight: value }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Altura (cm)</Label>
                    <Input 
                      type="number" 
                      placeholder="170"
                      value={localVitalSigns.height ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined
                        setLocalVitalSigns(prev => ({ ...prev, height: value }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SpO2 (%)</Label>
                    <Input 
                      type="number" 
                      placeholder="98"
                      value={localVitalSigns.oxygenSaturation ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined
                        setLocalVitalSigns(prev => ({ ...prev, oxygenSaturation: value }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>FR (rpm)</Label>
                    <Input 
                      type="number" 
                      placeholder="16"
                      value={localVitalSigns.respiratoryRate ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined
                        setLocalVitalSigns(prev => ({ ...prev, respiratoryRate: value }))
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exploración Física</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="physicalExam"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Hallazgos de la exploración física..." 
                          {...field} 
                          value={field.value ?? ''}
                          rows={8}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnosis" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Diagnóstico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnóstico *</FormLabel>
                      <FormControl>
                        <Textarea 
                          id="diagnosis"
                          placeholder="Diagnóstico principal (puede incluir código CIE-10)..." 
                          {...field} 
                          value={field.value ?? ''}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prognosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pronóstico</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Pronóstico del paciente..." 
                          {...field} 
                          value={field.value ?? ''}
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="treatment" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tratamiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="treatment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan de tratamiento</FormLabel>
                      <FormControl>
                        <Textarea 
                          id="treatment"
                          placeholder="Tratamiento indicado..." 
                          {...field} 
                          value={field.value ?? ''}
                          rows={6}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas adicionales</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notas adicionales..." 
                          {...field} 
                          value={field.value ?? ''}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Nota Médica'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
