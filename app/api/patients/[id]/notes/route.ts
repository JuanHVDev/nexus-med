import { auth } from "@/lib/auth"
import { getUserClinicId } from "@/lib/clinic"
import {
  patientService,
  PatientNotFoundError,
} from "@/lib/domain/patients"
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
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  try {
    const notes = await patientService.getPatientNotes(BigInt(id), BigInt(clinicId))
    return NextResponse.json(
      notes.map((note) => ({
        ...note,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    if (error instanceof PatientNotFoundError) {
      return new NextResponse("Patient not found", { status: 404 })
    }
    throw error
  }
}
