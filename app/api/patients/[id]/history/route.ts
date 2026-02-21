import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import {
  patientService,
  PatientNotFoundError,
  ALLOWED_ROLES_FOR_HISTORY,
} from "@/lib/domain/patients"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const { id } = await params

  try {
    const history = await patientService.getMedicalHistory(
      BigInt(id),
      BigInt(clinicId)
    )
    return NextResponse.json(history ?? {})
  } catch (error) {
    if (error instanceof PatientNotFoundError) {
      return new NextResponse("Not found", { status: 404 })
    }
    throw error
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const role = await getUserRole(session.user.id)
  if (!role || !ALLOWED_ROLES_FOR_HISTORY.includes(role as any)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const { id } = await params
  const body = await request.json()

  try {
    const history = await patientService.upsertMedicalHistory(
      BigInt(id),
      BigInt(clinicId),
      body
    )
    return NextResponse.json(history)
  } catch (error) {
    if (error instanceof PatientNotFoundError) {
      return new NextResponse("Not found", { status: 404 })
    }
    throw error
  }
}
