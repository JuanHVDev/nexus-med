import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import { appointmentService } from "@/lib/domain/appointments"
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

  const appointment = await appointmentService.getById(BigInt(id), clinicId)

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

  const result = await appointmentService.update(BigInt(id), clinicId, validated)

  if (!result.success) {
    if (result.error.includes("no encontrada")) {
      return new NextResponse(result.error, { status: 404 })
    }
    if (result.error.includes("hora de fin")) {
      return new NextResponse(result.error, { status: 400 })
    }
    return new NextResponse(result.error, { status: 409 })
  }

  return NextResponse.json({
    ...result.appointment,
    id: result.appointment.id.toString(),
    clinicId: result.appointment.clinicId.toString(),
    patientId: result.appointment.patientId.toString(),
    patient: {
      ...result.appointment.patient,
      id: result.appointment.patient.id.toString()
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

  const result = await appointmentService.cancel(BigInt(id), clinicId)

  if (!result.success) {
    return new NextResponse(result.error, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
