import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import { medicalNoteService, ALLOWED_ROLES } from "@/lib/domain/medical-notes"
import { medicalNoteUpdateSchema } from "@/lib/validations/medical-note"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

type AllowedRole = (typeof ALLOWED_ROLES)[number]

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

  const note = await medicalNoteService.getById(
    BigInt(id),
    BigInt(clinicId),
    session.user.id
  )

  if (!note) {
    return new NextResponse("Nota medica no encontrada", { status: 404 })
  }

  return NextResponse.json({
    ...note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    appointment: note.appointment
      ? {
          ...note.appointment,
          startTime: note.appointment.startTime.toISOString(),
          endTime: note.appointment.endTime.toISOString(),
        }
      : null,
    prescriptions: note.prescriptions.map((p) => ({
      ...p,
      issueDate: p.issueDate.toISOString(),
      validUntil: p.validUntil?.toISOString(),
      createdAt: p.createdAt.toISOString(),
    })),
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
  if (!userRole || !ALLOWED_ROLES.includes(userRole as AllowedRole)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const body = await request.json()
  const validated = medicalNoteUpdateSchema.parse(body)

  try {
    const note = await medicalNoteService.update(
      BigInt(id),
      BigInt(clinicId),
      validated,
      session.user.id
    )

    return NextResponse.json({
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Nota medica no encontrada") {
      return new NextResponse(error.message, { status: 404 })
    }
    throw error
  }
}
