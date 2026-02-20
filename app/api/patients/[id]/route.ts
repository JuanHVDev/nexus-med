import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import { prisma } from "@/lib/prisma"
import { patientEditSchema } from "@/lib/validations/patient"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { logAudit } from "@/lib/audit"

async function getPatientOrError(id: string, clinicId: bigint)
{
  const patient = await prisma.patient.findFirst({
    where: { id: BigInt(id), clinicId, deletedAt: null },
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

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const { id } = await params
  const patient = await getPatientOrError(id, clinicId)
  if (patient instanceof NextResponse) return patient

  const patientName = `${patient.firstName} ${patient.lastName}`
  await logAudit(session.user.id, {
    action: 'READ',
    entityType: 'Patient',
    entityId: id,
    entityName: patientName,
  })

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

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const { id } = await params
  const patient = await getPatientOrError(id, clinicId)
  if (patient instanceof NextResponse) return patient

  const body = await request.json()
  const validated = patientEditSchema.parse(body)

  const dataToUpdate: Record<string, unknown> = { ...validated }
  if (dataToUpdate.birthDate && typeof dataToUpdate.birthDate === 'string') {
    dataToUpdate.birthDate = new Date(dataToUpdate.birthDate)
  }

  const updated = await prisma.patient.update({
    where: { id: BigInt(id) },
    data: dataToUpdate
  })

  await logAudit(session.user.id, {
    action: 'UPDATE',
    entityType: 'Patient',
    entityId: id,
    entityName: `${updated.firstName} ${updated.lastName}`,
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

  const role = await getUserRole(session.user.id)
  if (role !== "ADMIN")
  {
    return new NextResponse("Only admins can delete patients", { status: 403 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("No clinic assigned", { status: 403 })

  const { id } = await params
  const patient = await getPatientOrError(id, clinicId)
  if (patient instanceof NextResponse) return patient

  const patientName = `${patient.firstName} ${patient.lastName}`

  await prisma.patient.update({ 
    where: { id: BigInt(id) },
    data: { deletedAt: new Date() }
  })

  await logAudit(session.user.id, {
    action: 'DELETE',
    entityType: 'Patient',
    entityId: id,
    entityName: patientName,
  })

  return new NextResponse(null, { status: 204 })
}
