import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserClinicId } from "@/lib/clinic"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { NewMedicalNoteForm } from '../../new/new-note-form'

interface PageProps {
  params: Promise<{ id: string; noteId: string }>
}

export default async function EditMedicalNotePage({ params }: PageProps) {
  const { id, noteId } = await params
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

  const note = await prisma.medicalNote.findFirst({
    where: {
      id: BigInt(noteId),
      patientId: BigInt(id),
      clinicId
    }
  })

  if (!note) {
    notFound()
  }

  let appointment = null
  if (note.appointmentId) {
    appointment = await prisma.appointment.findFirst({
      where: {
        id: note.appointmentId,
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
        <h1 className="text-3xl font-bold tracking-tight">Editar Nota Médica</h1>
        <p className="text-muted-foreground">
          Paciente: {patient.firstName} {patient.middleName || ''} {patient.lastName}
        </p>
      </div>

      <NewMedicalNoteForm 
        patient={patientData}
        appointment={appointmentData}
        isEditMode={true}
        noteId={noteId}
      />
    </div>
  )
}
