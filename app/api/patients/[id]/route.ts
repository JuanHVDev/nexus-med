import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import {
  patientService,
  PatientNotFoundError,
  ALLOWED_ROLES_FOR_UPDATE,
  ALLOWED_ROLES_FOR_DELETE,
} from "@/lib/domain/patients"
import { patientEditSchema } from "@/lib/validations/patient"
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
    const patient = await patientService.getById(
      BigInt(id),
      BigInt(clinicId),
      session.user.id
    )
    return NextResponse.json(patient)
  } catch (error) {
    if (error instanceof PatientNotFoundError) {
      return new NextResponse("Patient not found", { status: 404 })
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

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const { id } = await params
  const body = await request.json()
  const validated = patientEditSchema.parse(body)

  const dataToUpdate: Record<string, unknown> = { ...validated }
  if (dataToUpdate.birthDate && typeof dataToUpdate.birthDate === "string") {
    dataToUpdate.birthDate = new Date(dataToUpdate.birthDate)
  }

  try {
    const patient = await patientService.update(
      BigInt(id),
      BigInt(clinicId),
      dataToUpdate,
      session.user.id
    )
    return NextResponse.json(patient)
  } catch (error) {
    if (error instanceof PatientNotFoundError) {
      return new NextResponse("Patient not found", { status: 404 })
    }
    throw error
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const role = await getUserRole(session.user.id)
  if (!role || !ALLOWED_ROLES_FOR_DELETE.includes(role as any)) {
    return new NextResponse("Only admins can delete patients", { status: 403 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const { id } = await params

  try {
    await patientService.softDelete(BigInt(id), BigInt(clinicId), session.user.id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof PatientNotFoundError) {
      return new NextResponse("Patient not found", { status: 404 })
    }
    throw error
  }
}
