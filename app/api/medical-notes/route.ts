import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import { prisma } from "@/lib/prisma"
import { medicalNoteSchema } from "@/lib/validations/medical-note"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const patientId = searchParams.get("patientId")
  const doctorId = searchParams.get("doctorId")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const search = searchParams.get("search")

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })
  const where: Record<string, unknown> = {
    clinicId,
  }

  if (patientId) where.patientId = BigInt(patientId)
  if (doctorId) where.doctorId = doctorId
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate)
    if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate)
  }
  if (search) {
    where.OR = [
      { patient: { firstName: { contains: search, mode: 'insensitive' } } },
      { patient: { lastName: { contains: search, mode: 'insensitive' } } },
      { diagnosis: { contains: search, mode: 'insensitive' } },
      { chiefComplaint: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [notes, total] = await Promise.all([
    prisma.medicalNote.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
    }),
    prisma.medicalNote.count({ where })
  ])

  return NextResponse.json({
    data: notes.map(note => ({
      ...note,
      id: note.id.toString(),
      clinicId: note.clinicId.toString(),
      patientId: note.patientId.toString(),
      appointmentId: note.appointmentId?.toString() ?? null,
      patient: {
        ...note.patient,
        id: note.patient.id.toString()
      }
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  })
}

export async function POST(request: Request) {
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
  const body = await request.json()
  const validated = medicalNoteSchema.parse(body)

  const patient = await prisma.patient.findFirst({
    where: {
      id: validated.patientId,
      clinicId,
      deletedAt: null
    }
  })

  if (!patient) {
    return new NextResponse("Paciente no encontrado", { status: 404 })
  }

  if (validated.appointmentId) {
    const existingNote = await prisma.medicalNote.findFirst({
      where: {
        appointmentId: validated.appointmentId
      }
    })

    if (existingNote) {
      const updatedNote = await prisma.medicalNote.update({
        where: { id: existingNote.id },
        data: {
          specialty: validated.specialty,
          type: validated.type,
          chiefComplaint: validated.chiefComplaint,
          currentIllness: validated.currentIllness,
          vitalSigns: validated.vitalSigns,
          physicalExam: validated.physicalExam,
          diagnosis: validated.diagnosis,
          prognosis: validated.prognosis,
          treatment: validated.treatment,
          notes: validated.notes,
        },
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

      if (validated.appointmentId) {
        await prisma.appointment.update({
          where: { id: validated.appointmentId },
          data: { status: "COMPLETED" }
        })
      }

      return NextResponse.json({
        ...updatedNote,
        id: updatedNote.id.toString(),
        clinicId: updatedNote.clinicId.toString(),
        patientId: updatedNote.patientId.toString(),
        appointmentId: updatedNote.appointmentId?.toString(),
        patient: {
          ...updatedNote.patient,
          id: updatedNote.patient.id.toString()
        }
      })
    }
  }

  const note = await prisma.medicalNote.create({
    data: {
      ...validated,
      clinicId: BigInt(clinicId!),
      doctorId: session.user.id,
    },
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

  if (validated.appointmentId) {
    await prisma.appointment.update({
      where: { id: validated.appointmentId },
      data: { status: "IN_PROGRESS" }
    })
  }

  return NextResponse.json({
    ...note,
    id: note.id.toString(),
    clinicId: note.clinicId.toString(),
    patientId: note.patientId.toString(),
    appointmentId: note.appointmentId?.toString(),
    patient: {
      ...note.patient,
      id: note.patient.id.toString()
    }
  }, { status: 201 })
}
