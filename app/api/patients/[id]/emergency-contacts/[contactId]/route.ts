import { auth } from "@/lib/auth"
import { getUserClinicId } from "@/lib/clinic"
import {
  patientService,
  PatientNotFoundError,
} from "@/lib/domain/patients"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const { id, contactId } = await params

  try {
    await patientService.deleteEmergencyContact(
      BigInt(id),
      BigInt(contactId),
      BigInt(clinicId)
    )
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof PatientNotFoundError) {
      return new NextResponse("Patient not found", { status: 404 })
    }
    if (error instanceof Error && error.message === "Contact not found") {
      return new NextResponse("Contact not found", { status: 404 })
    }
    throw error
  }
}
