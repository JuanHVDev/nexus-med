import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import { medicalNoteService, ALLOWED_ROLES } from "@/lib/domain/medical-notes"
import { medicalNoteSchema } from "@/lib/validations/medical-note"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

type AllowedRole = (typeof ALLOWED_ROLES)[number]

export async function GET(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const patientId = searchParams.get("patientId") ?? undefined
  const doctorId = searchParams.get("doctorId") ?? undefined
  const search = searchParams.get("search") ?? undefined
  const startDate = searchParams.get("startDate")
    ? new Date(searchParams.get("startDate")!)
    : undefined
  const endDate = searchParams.get("endDate")
    ? new Date(searchParams.get("endDate")!)
    : undefined

  const filters = { patientId, doctorId, startDate, endDate, search }

  const result = await medicalNoteService.listByClinic(
    BigInt(clinicId),
    filters,
    page,
    limit
  )

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const userRole = await getUserRole(session.user.id)
  if (!userRole || !ALLOWED_ROLES.includes(userRole as AllowedRole)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const body = await request.json()
  const validated = medicalNoteSchema.parse(body)

  try {
    const note = await medicalNoteService.create(
      BigInt(clinicId),
      session.user.id,
      {
        patientId: validated.patientId,
        appointmentId: validated.appointmentId,
        specialty: validated.specialty,
        type: validated.type,
        chiefComplaint: validated.chiefComplaint,
        currentIllness: validated.currentIllness,
        vitalSigns: validated.vitalSigns
          ? JSON.parse(validated.vitalSigns as string)
          : undefined,
        physicalExam: validated.physicalExam,
        diagnosis: validated.diagnosis,
        prognosis: validated.prognosis,
        treatment: validated.treatment,
        notes: validated.notes,
      },
      session.user.id
    )

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Paciente no encontrado") {
      return new NextResponse(error.message, { status: 404 })
    }
    throw error
  }
}
