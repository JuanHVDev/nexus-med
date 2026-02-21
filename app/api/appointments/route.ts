import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import { appointmentService } from "@/lib/domain/appointments"
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
  const doctorId = searchParams.get("doctorId") || undefined
  const patientId = searchParams.get("patientId")
  const status = searchParams.get("status") as "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | undefined
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const result = await appointmentService.getMany({
    clinicId,
    doctorId,
    patientId: patientId ? BigInt(patientId) : undefined,
    status,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  }, page, limit)

  return NextResponse.json({
    data: result.appointments.map(apt => ({
      ...apt,
      id: apt.id.toString(),
      clinicId: apt.clinicId.toString(),
      patientId: apt.patientId.toString(),
      patient: {
        ...apt.patient,
        id: apt.patient.id.toString()
      }
    })),
    pagination: { page, limit, total: result.total, pages: result.pages }
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

  const result = await appointmentService.create({
    patientId: validated.patientId,
    doctorId: validated.doctorId,
    startTime: validated.startTime,
    endTime: validated.endTime,
    status: validated.status,
    reason: validated.reason,
    notes: validated.notes,
  }, clinicId, session.user.id)

  if (!result.success) {
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
  }, { status: 201 })
}
