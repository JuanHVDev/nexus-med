import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { emergencyContactSchema } from "@/lib/validations/patient"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

async function verifyPatientOwnership(patientId: string, clinicId: bigint) {
  const patient = await prisma.patient.findFirst({
    where: { id: BigInt(patientId), clinicId, deletedAt: null }
  })
  if (!patient) return null
  return patient
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params
  const patient = await verifyPatientOwnership(id, BigInt(session.user.clinicId!))
  if (!patient) return new NextResponse("Patient not found", { status: 404 })

  const contacts = await prisma.emergencyContact.findMany({
    where: { patientId: BigInt(id) },
    orderBy: { isPrimary: 'desc' }
  })

  return NextResponse.json(contacts.map(c => ({
    ...c,
    id: c.id.toString(),
    patientId: c.patientId.toString()
  })))
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  // Verificar permisos
  const allowedRoles = ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]
  if (!allowedRoles.includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const { id } = await params
  const patient = await verifyPatientOwnership(id, BigInt(session.user.clinicId!))
  if (!patient) return new NextResponse("Patient not found", { status: 404 })

  const body = await request.json()
  const validated = emergencyContactSchema.parse(body)

  // Si es primary, quitar primary de otros contactos
  if (validated.isPrimary) {
    await prisma.emergencyContact.updateMany({
      where: { patientId: BigInt(id), isPrimary: true },
      data: { isPrimary: false }
    })
  }

  const contact = await prisma.emergencyContact.create({
    data: {
      ...validated,
      patientId: BigInt(id)
    }
  })

  return NextResponse.json({
    ...contact,
    id: contact.id.toString(),
    patientId: contact.patientId.toString()
  }, { status: 201 })
}
