import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import {
  patientService,
  ALLOWED_ROLES_FOR_CREATE,
  DuplicateCurpError,
} from "@/lib/domain/patients"
import { patientSchema } from "@/lib/validations/patient"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const search = searchParams.get("search") ?? undefined

  const result = await patientService.listByClinic(
    BigInt(clinicId),
    { search },
    page,
    limit
  )

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const userRole = await getUserRole(session.user.id)
  if (!userRole || !ALLOWED_ROLES_FOR_CREATE.includes(userRole as any)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const body = await request.json()
  const validated = patientSchema.parse(body)

  try {
    const patient = await patientService.create(
      BigInt(clinicId),
      validated,
      session.user.id
    )

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    if (error instanceof DuplicateCurpError) {
      return new NextResponse("CURP ya registrada", { status: 400 })
    }
    throw error
  }
}
