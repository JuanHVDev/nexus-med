import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { MedicalNoteDetailClient } from "@/components/medical-notes/medical-note-detail-client"

interface PageProps {
  params: Promise<{ id: string; noteId: string }>
}

export default async function MedicalNoteDetailPage({ params }: PageProps) {
  const { id, noteId } = await params
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session) {
    return <div>No autorizado</div>
  }

  const note = await prisma.medicalNote.findFirst({
    where: {
      id: BigInt(noteId),
      patientId: BigInt(id),
      clinicId: session.user.clinicId
    },
    include: {
      patient: true,
      doctor: {
        select: {
          id: true,
          name: true,
          specialty: true,
          licenseNumber: true,
        }
      },
      prescriptions: {
        select: {
          id: true,
          medications: true,
          instructions: true,
          createdAt: true,
          doctor: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  if (!note) {
    notFound()
  }

  const vitalSigns = note.vitalSigns 
    ? typeof note.vitalSigns === 'string' 
      ? JSON.parse(note.vitalSigns) 
      : JSON.parse(JSON.stringify(note.vitalSigns))
    : null

  const noteData = {
    id: note.id.toString(),
    createdAt: note.createdAt,
    chiefComplaint: note.chiefComplaint,
    currentIllness: note.currentIllness,
    physicalExam: note.physicalExam,
    diagnosis: note.diagnosis,
    prognosis: note.prognosis,
    treatment: note.treatment,
    notes: note.notes,
    specialty: note.specialty,
    type: note.type,
    patient: {
      id: note.patient.id.toString(),
      firstName: note.patient.firstName,
      lastName: note.patient.lastName,
      middleName: note.patient.middleName,
      curp: note.patient.curp,
    },
    doctor: {
      id: note.doctor.id,
      name: note.doctor.name,
      specialty: note.doctor.specialty,
      licenseNumber: note.doctor.licenseNumber,
    },
    prescriptions: note.prescriptions.map(p => ({
      id: p.id.toString(),
      medications: p.medications as { name: string; dosage: string; route: string }[],
      instructions: p.instructions,
      createdAt: p.createdAt.toISOString(),
      doctor: p.doctor,
    })),
    vitalSigns,
  }

  return <MedicalNoteDetailClient note={noteData} patientId={id} />
}
