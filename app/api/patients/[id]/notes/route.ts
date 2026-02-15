import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const notes = await prisma.medicalNote.findMany({
    where: {
      patientId: BigInt(id),
      clinicId: session.user.clinicId
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          specialty: true,
        }
      }
    }
  })

  return NextResponse.json(notes.map(note => ({
    id: note.id.toString(),
    clinicId: note.clinicId.toString(),
    patientId: note.patientId.toString(),
    doctorId: note.doctorId,
    appointmentId: note.appointmentId?.toString() || null,
    specialty: note.specialty,
    type: note.type,
    chiefComplaint: note.chiefComplaint,
    currentIllness: note.currentIllness,
    vitalSigns: note.vitalSigns,
    physicalExam: note.physicalExam,
    diagnosis: note.diagnosis,
    prognosis: note.prognosis,
    treatment: note.treatment,
    notes: note.notes,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    doctor: note.doctor
  })))
}
