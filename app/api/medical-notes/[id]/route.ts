import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import { prisma } from "@/lib/prisma"
import { medicalNoteUpdateTransform } from "@/lib/validations/medical-note"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { logAudit } from "@/lib/audit"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })
  const note = await prisma.medicalNote.findFirst({
    where: {
      id: BigInt(id),
      clinicId
    },
    include: {
      patient: true,
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
          specialty: true,
          licenseNumber: true,
        }
      },
      prescriptions: true,
      appointment: true
    }
  })

  if (!note) {
    return new NextResponse("Nota medica no encontrada", { status: 404 })
  }

  await logAudit(session.user.id, {
    action: 'READ',
    entityType: 'MedicalNote',
    entityId: id,
    entityName: `Nota medica - ${note.patient.firstName} ${note.patient.lastName}`,
  })

  return NextResponse.json({
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
    patient: {
      id: note.patient.id.toString(),
      firstName: note.patient.firstName,
      lastName: note.patient.lastName,
      middleName: note.patient.middleName,
    },
    doctor: {
      id: note.doctor.id,
      name: note.doctor.name,
      email: note.doctor.email,
      specialty: note.doctor.specialty,
      licenseNumber: note.doctor.licenseNumber,
    },
    appointment: note.appointment ? {
      id: note.appointment.id.toString(),
      clinicId: note.appointment.clinicId.toString(),
      patientId: note.appointment.patientId.toString(),
      doctorId: note.appointment.doctorId,
      startTime: note.appointment.startTime.toISOString(),
      endTime: note.appointment.endTime.toISOString(),
      status: note.appointment.status,
      reason: note.appointment.reason,
      notes: note.appointment.notes,
    } : null,
    prescriptions: note.prescriptions.map(p => ({
      id: p.id.toString(),
      patientId: p.patientId.toString(),
      doctorId: p.doctorId,
      medicalNoteId: p.medicalNoteId.toString(),
      medications: p.medications,
      instructions: p.instructions,
      issueDate: p.issueDate.toISOString(),
      validUntil: p.validUntil?.toISOString(),
      createdAt: p.createdAt.toISOString(),
    }))
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const userRole = await getUserRole(session.user.id)
  if (!userRole) return new NextResponse("No role assigned", { status: 403 })
  const allowedRoles = ["ADMIN", "DOCTOR"]
  if (!allowedRoles.includes(userRole)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })
  const existingNote = await prisma.medicalNote.findFirst({
    where: {
      id: BigInt(id),
      clinicId
    }
  })

  if (!existingNote) {
    return new NextResponse("Nota médica no encontrada", { status: 404 })
  }

  const body = await request.json()
  const validated = medicalNoteUpdateTransform.parse(body)

  const note = await prisma.medicalNote.update({
    where: { id: BigInt(id) },
    data: validated,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          middleName: true,
        }
      },
      doctor: {
        select: {
          id: true,
          name: true,
          specialty: true,
        }
      }
    }
  })

  if (existingNote.appointmentId) {
    await prisma.appointment.update({
      where: { id: existingNote.appointmentId },
      data: { status: "COMPLETED" }
    })
  }

  await logAudit(session.user.id, {
    action: 'UPDATE',
    entityType: 'MedicalNote',
    entityId: id,
    entityName: `Nota medica - ${note.patient.firstName} ${note.patient.lastName}`,
  })

  return NextResponse.json({
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
    patient: {
      id: note.patient.id.toString(),
      firstName: note.patient.firstName,
      lastName: note.patient.lastName,
      middleName: note.patient.middleName,
    }
  })
}
