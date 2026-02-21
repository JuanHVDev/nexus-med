import { auth } from "@/lib/auth"
import { getUserClinicId } from "@/lib/clinic"
import {
  prescriptionService,
  PatientNotFoundError,
  MedicalNoteNotFoundError,
  PrescriptionAlreadyExistsError,
} from "@/lib/domain/prescriptions"
import { prescriptionInputSchema } from "@/lib/validations/prescription"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const patientId = searchParams.get("patientId") ?? undefined
  const doctorId = searchParams.get("doctorId") ?? undefined
  const search = searchParams.get("search") ?? undefined

  const result = await prescriptionService.listByClinic(
    BigInt(clinicId),
    { patientId, doctorId, search },
    page,
    limit
  )

  return NextResponse.json({
    data: result.data.map((p) => ({
      ...p,
      issueDate: p.issueDate.toISOString(),
      validUntil: p.validUntil?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      medicalNote: {
        ...p.medicalNote,
        createdAt: p.medicalNote.createdAt.toISOString(),
      },
    })),
    pagination: result.pagination,
  })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const validation = prescriptionInputSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { message: "Validation error", errors: validation.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { patientId, medicalNoteId, medications, instructions, validUntil } = validation.data

  try {
    const prescription = await prescriptionService.create(
      BigInt(clinicId),
      session.user.id,
      {
        patientId: BigInt(patientId),
        medicalNoteId: BigInt(medicalNoteId),
        medications,
        instructions,
        validUntil: validUntil ? new Date(validUntil) : undefined,
      },
      session.user.id
    )

    return NextResponse.json(
      {
        ...prescription,
        issueDate: prescription.issueDate.toISOString(),
        validUntil: prescription.validUntil?.toISOString() ?? null,
        createdAt: prescription.createdAt.toISOString(),
        updatedAt: prescription.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof PatientNotFoundError) {
      return NextResponse.json({ message: "Patient not found" }, { status: 404 })
    }
    if (error instanceof MedicalNoteNotFoundError) {
      return NextResponse.json({ message: "Medical note not found" }, { status: 404 })
    }
    if (error instanceof PrescriptionAlreadyExistsError) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }
    throw error
  }
}
