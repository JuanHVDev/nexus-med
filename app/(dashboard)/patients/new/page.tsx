'use client'
import { useRouter } from 'next/navigation'
import { PatientForm } from '@/components/patients/patient-form'
import { toast } from 'sonner'
import type { PatientInputFormData } from '@/lib/validations/patient'
export default function NewPatientPage()
{
  const router = useRouter()
  const handleSubmit = async (data: PatientInputFormData) =>
  {
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok)
    {
      const error = await response.json()
      toast.error(error.message || 'Error al crear paciente')
      return
    }
    toast.success('Paciente creado exitosamente')
    router.push('/patients')
    router.refresh()
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Paciente</h1>
        <p className="text-muted-foreground">Registra un nuevo paciente en el sistema</p>
      </div>
      <PatientForm onSubmit={handleSubmit} />
    </div>
  )
}