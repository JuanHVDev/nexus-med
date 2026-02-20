import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import { appointmentSchema } from "@/lib/validations/appointment"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) {
    return new NextResponse("No clinic assigned", { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "100")
  const doctorId = searchParams.get("doctorId")
  const patientId = searchParams.get("patientId")
  const status = searchParams.get("status")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const where: Record<string, unknown> = {
    clinicId,
  }

  if (doctorId) where.doctorId = doctorId
  if (patientId) where.patientId = BigInt(patientId)
  if (status) where.status = status
  if (startDate || endDate) {
    where.startTime = {}
    if (startDate) (where.startTime as Record<string, Date>).gte = new Date(startDate)
    if (endDate) (where.startTime as Record<string, Date>).lte = new Date(endDate)
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { startTime: 'asc' },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            phone: true,
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
    prisma.appointment.count({ where })
  ])

  return NextResponse.json({
    data: appointments.map(apt => ({
      ...apt,
      id: apt.id.toString(),
      clinicId: apt.clinicId.toString(),
      patientId: apt.patientId.toString(),
      patient: {
        ...apt.patient,
        id: apt.patient.id.toString()
      }
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  })
}

export async function POST(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const clinicId = await getUserClinicId(session.user.id)
  const userRole = await getUserRole(session.user.id)
  
  if (!clinicId) {
    return new NextResponse("No clinic assigned", { status: 403 })
  }

  const allowedRoles = ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]
  if (!userRole || !allowedRoles.includes(userRole)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const body = await request.json()
  
  let validated
  try {
    validated = appointmentSchema.parse(body)
  } catch (e) {
    console.error("Validation error:", e)
    return NextResponse.json({ error: "Datos inválidos", details: JSON.stringify(e, null, 2) }, { status: 400 })
  }

  const patient = await prisma.patient.findFirst({
    where: { id: validated.patientId, clinicId, deletedAt: null }
  })
  if (!patient) {
    return new NextResponse("Patient not found", { status: 404 })
  }

  const startTime = validated.startTime
  const endTime = validated.endTime

  if (endTime <= startTime) {
    return new NextResponse("La hora de fin debe ser posterior a la hora de inicio", { status: 400 })
  }

  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      doctorId: validated.doctorId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } }
          ]
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } }
          ]
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } }
          ]
        }
      ]
    }
  })

  if (conflictingAppointment) {
    return new NextResponse("El doctor ya tiene una cita en ese horario", { status: 409 })
  }

  const appointment = await prisma.appointment.create({
    data: {
      ...validated,
      clinicId
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          middleName: true,
          phone: true,
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

  return NextResponse.json({
    ...appointment,
    id: appointment.id.toString(),
    clinicId: appointment.clinicId.toString(),
    patientId: appointment.patientId.toString(),
    patient: {
      ...appointment.patient,
      id: appointment.patient.id.toString()
    }
  }, { status: 201 })
}
