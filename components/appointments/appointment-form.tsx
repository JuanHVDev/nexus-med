'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { appointmentInputSchema, type AppointmentInputFormData } from '@/lib/validations/appointment'

interface Patient {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  phone?: string
}

interface Doctor {
  id: string
  name: string
  specialty?: string
}

interface AppointmentFormProps {
  onSubmit: (data: AppointmentInputFormData) => Promise<void>
  defaultValues?: Partial<AppointmentInputFormData>
  isLoading?: boolean
  onCancel?: () => void
}

export function AppointmentForm({ onSubmit, defaultValues, isLoading, onCancel }: AppointmentFormProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  const form = useForm<AppointmentInputFormData>({
    resolver: zodResolver(appointmentInputSchema),
    defaultValues: {
      patientId: '',
      doctorId: '',
      startTime: '',
      endTime: '',
      status: 'SCHEDULED',
      reason: '',
      notes: '',
      ...defaultValues,
    },
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          fetch('/api/patients?limit=1000'),
          fetch('/api/users/doctors'),
        ])

        if (patientsRes.ok) {
          const patientsData = await patientsRes.json()
          setPatients(patientsData.data || [])
        }

        if (doctorsRes.ok) {
          const doctorsData = await doctorsRes.json()
          setDoctors(doctorsData.data || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoadingPatients(false)
        setLoadingDoctors(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (data: AppointmentInputFormData) => {
    try {
      await onSubmit(data)
      toast.success('Cita creada correctamente')
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error('Error al crear la cita')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={loadingPatients}
                >
                  <FormControl>
                    <SelectTrigger id="patientId">
                      <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName}{patient.middleName ? ` ${patient.middleName}` : ''} {patient.lastName}
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
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={loadingDoctors}
                >
                  <FormControl>
                    <SelectTrigger id="doctorId">
                      <SelectValue placeholder="Seleccionar doctor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name} {doctor.specialty && `(${doctor.specialty})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha y hora de inicio *</FormLabel>
                <FormControl>
                  <Input id="startTime" type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha y hora de fin *</FormLabel>
                <FormControl>
                  <Input id="endTime" type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Programada</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                  <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                  <SelectItem value="COMPLETED">Completada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  <SelectItem value="NO_SHOW">No se presentó</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo de la cita</FormLabel>
              <FormControl>
                <Input id="reason" placeholder="Consulta general, Seguimiento, etc." {...field} value={field.value ?? ''} />
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
                <Input id="notes" placeholder="Notas adicionales..." {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading || loadingPatients || loadingDoctors}>
            {isLoading ? 'Guardando...' : 'Guardar cita'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
