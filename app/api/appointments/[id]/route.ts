import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import { prisma } from "@/lib/prisma"
import { appointmentUpdateTransform } from "@/lib/validations/appointment"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("Clinic not found", { status: 403 })

  const appointment = await prisma.appointment.findFirst({
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
      medicalNote: true
    }
  })

  if (!appointment) {
    return new NextResponse("Cita no encontrada", { status: 404 })
  }

  return NextResponse.json({
    ...appointment,
    id: appointment.id.toString(),
    clinicId: appointment.clinicId.toString(),
    patientId: appointment.patientId.toString(),
    patient: {
      ...appointment.patient,
      id: appointment.patient.id.toString()
    }
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

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("Clinic not found", { status: 403 })

  const userRole = await getUserRole(session.user.id)
  const allowedRoles = ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]
  if (!userRole || !allowedRoles.includes(userRole)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const body = await request.json()
  const validated = appointmentUpdateTransform.parse(body)

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      id: BigInt(id),
      clinicId
    }
  })

  if (!existingAppointment) {
    return new NextResponse("Cita no encontrada", { status: 404 })
  }

  if (validated.startTime && validated.endTime) {
    if (validated.endTime <= validated.startTime) {
      return new NextResponse("La hora de fin debe ser posterior a la hora de inicio", { status: 400 })
    }
  }

  const appointment = await prisma.appointment.update({
    where: { id: BigInt(id) },
    data: validated,
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
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("Clinic not found", { status: 403 })

  const userRole = await getUserRole(session.user.id)
  const allowedRoles = ["ADMIN", "DOCTOR", "RECEPTIONIST"]
  if (!userRole || !allowedRoles.includes(userRole)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      id: BigInt(id),
      clinicId
    }
  })

  if (!existingAppointment) {
    return new NextResponse("Cita no encontrada", { status: 404 })
  }

  await prisma.appointment.update({
    where: { id: BigInt(id) },
    data: { status: "CANCELLED" }
  })

  return new NextResponse(null, { status: 204 })
}
