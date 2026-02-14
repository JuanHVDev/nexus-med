import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { patientEditSchema } from "@/lib/validations/patient"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

async function getPatientOrError(id: string, clinicId: bigint)
{
  const patient = await prisma.patient.findFirst({
    where: { id: BigInt(id), clinicId },
    include: {
      medicalHistory: true,
      emergencyContacts: true,
      _count: { select: { appointments: true, medicalNotes: true } }
    }
  })
  if (!patient) return new NextResponse("Patient not found", { status: 404 })
  return patient
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
)
{
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params
  const patient = await getPatientOrError(id, BigInt(session.user.clinicId!))
  if (patient instanceof NextResponse) return patient

  return NextResponse.json({
    ...patient,
    id: patient.id.toString(),
    clinicId: patient.clinicId.toString(),
    medicalHistory: patient.medicalHistory ? {
      ...patient.medicalHistory,
      id: patient.medicalHistory.id.toString(),
      patientId: patient.medicalHistory.patientId.toString()
    } : null,
    emergencyContacts: patient.emergencyContacts.map(ec => ({
      ...ec,
      id: ec.id.toString(),
      patientId: ec.patientId.toString()
    }))
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
)
{
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params
  const patient = await getPatientOrError(id, BigInt(session.user.clinicId!))
  if (patient instanceof NextResponse) return patient

  const body = await request.json()
  const validated = patientEditSchema.parse(body)

  const dataToUpdate: any = { ...validated }
  if (dataToUpdate.birthDate) {
    dataToUpdate.birthDate = new Date(dataToUpdate.birthDate)
  }

  const updated = await prisma.patient.update({
    where: { id: BigInt(id) },
    data: dataToUpdate
  })

  return NextResponse.json({
    ...updated,
    id: updated.id.toString(),
    clinicId: updated.clinicId.toString()
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
)
{
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  // Solo admin puede eliminar
  if (session.user.role !== "ADMIN")
  {
    return new NextResponse("Only admins can delete patients", { status: 403 })
  }

  const { id } = await params
  const patient = await getPatientOrError(id, BigInt(session.user.clinicId!))
  if (patient instanceof NextResponse) return patient

  await prisma.patient.delete({ where: { id: BigInt(id) } })

  return new NextResponse("Patient deleted", { status: 204 })
}
