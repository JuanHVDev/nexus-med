import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import {
  patientService,
  PatientNotFoundError,
  ALLOWED_ROLES_FOR_CONTACTS,
} from "@/lib/domain/patients"
import { emergencyContactSchema } from "@/lib/validations/patient"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

type AllowedRole = (typeof ALLOWED_ROLES_FOR_CONTACTS)[number]

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
    const contacts = await patientService.getEmergencyContacts(
      BigInt(id),
      BigInt(clinicId)
    )
    return NextResponse.json(contacts)
  } catch (error) {
    if (error instanceof PatientNotFoundError) {
      return new NextResponse("Patient not found", { status: 404 })
    }
    throw error
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const role = await getUserRole(session.user.id)
  if (!role || !ALLOWED_ROLES_FOR_CONTACTS.includes(role as AllowedRole)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const validated = emergencyContactSchema.parse(body)

  try {
    const contact = await patientService.createEmergencyContact(
      BigInt(id),
      BigInt(clinicId),
      validated
    )
    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    if (error instanceof PatientNotFoundError) {
      return new NextResponse("Patient not found", { status: 404 })
    }
    throw error
  }
}
