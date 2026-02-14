'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { PatientForm } from '@/components/patients/patient-form'
import { toast } from 'sonner'
import type { PatientEditInputFormData } from '@/lib/validations/patient'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface EditPatientPageProps {
  params: Promise<{ id: string }>
}

export default function EditPatientPage({ params }: EditPatientPageProps) {
  const router = useRouter()
  const [id, setId] = React.useState<string>('')

  React.useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => fetch(`/api/patients/${id}`).then(r => r.json()),
    enabled: !!id
  })

  const handleSubmit = async (data: PatientEditInputFormData) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== null && v !== undefined && v !== '')
    )
    
    const response = await fetch(`/api/patients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanedData)
    })

    if (!response.ok) {
      const error = await response.json()
      toast.error(error.message || 'Error al actualizar paciente')
      return
    }

    toast.success('Paciente actualizado exitosamente')
    router.push(`/patients/${id}`)
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const defaultValues = patient ? {
    firstName: patient.firstName ?? '',
    lastName: patient.lastName ?? '',
    middleName: patient.middleName ?? '',
    curp: patient.curp ?? '',
    birthDate: patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : '',
    gender: patient.gender ?? undefined,
    bloodType: patient.bloodType ?? undefined,
    email: patient.email ?? '',
    phone: patient.phone ?? '',
    mobile: patient.mobile ?? '',
    address: patient.address ?? '',
    city: patient.city ?? '',
    state: patient.state ?? '',
    zipCode: patient.zipCode ?? '',
    notes: patient.notes ?? '',
  } : {}

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/patients/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Paciente</h1>
          <p className="text-muted-foreground">Actualiza la información del paciente</p>
        </div>
      </div>
      <PatientForm onSubmit={handleSubmit} defaultValues={defaultValues} mode="edit" />
    </div>
  )
}
