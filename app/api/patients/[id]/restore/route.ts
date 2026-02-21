import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import {
  patientService,
  PatientNotDeletedError,
  ALLOWED_ROLES_FOR_RESTORE,
} from "@/lib/domain/patients"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const role = await getUserRole(session.user.id)
  if (!role || !ALLOWED_ROLES_FOR_RESTORE.includes(role as any)) {
    return new NextResponse("Only admins can restore patients", { status: 403 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const { id } = await params

  try {
    const patient = await patientService.restore(
      BigInt(id),
      BigInt(clinicId),
      session.user.id
    )
    return NextResponse.json(patient)
  } catch (error) {
    if (error instanceof PatientNotDeletedError) {
      return new NextResponse("Patient not found or not deleted", { status: 404 })
    }
    throw error
  }
}
