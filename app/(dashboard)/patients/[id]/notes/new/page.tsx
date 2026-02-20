import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserClinicId } from "@/lib/clinic"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { NewMedicalNoteForm } from './new-note-form'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ appointmentId?: string }>
}

export default async function NewMedicalNotePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { appointmentId } = await searchParams
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session) {
    return <div>No autorizado</div>
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) {
    return <div>No autorizado</div>
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id: BigInt(id),
      clinicId
    }
  })

  if (!patient) {
    notFound()
  }

  let appointment = null
  if (appointmentId) {
    appointment = await prisma.appointment.findFirst({
      where: {
        id: BigInt(appointmentId),
        patientId: BigInt(id),
        clinicId
      }
    })
  }

  const patientData = {
    id: patient.id.toString(),
    firstName: patient.firstName,
    lastName: patient.lastName,
    middleName: patient.middleName || undefined,
  }

  const appointmentData = appointment ? {
    id: appointment.id.toString(),
    startTime: appointment.startTime.toISOString(),
    reason: appointment.reason || undefined,
  } : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Nota Médica</h1>
        <p className="text-muted-foreground">
          Paciente: {patient.firstName} {patient.middleName || ''} {patient.lastName}
        </p>
      </div>

      <NewMedicalNoteForm 
        patient={patientData}
        appointment={appointmentData}
      />
    </div>
  )
}
