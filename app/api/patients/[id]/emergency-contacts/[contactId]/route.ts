import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { id, contactId } = await params

  // Verificar ownership del paciente
  const patient = await prisma.patient.findFirst({
    where: { id: BigInt(id), clinicId: BigInt(session.user.clinicId!), deletedAt: null }
  })
  
  if (!patient) {
    return new NextResponse("Patient not found", { status: 404 })
  }

  // Verificar que el contacto pertenece al paciente
  const contact = await prisma.emergencyContact.findFirst({
    where: { 
      id: BigInt(contactId),
      patientId: BigInt(id)
    }
  })

  if (!contact) {
    return new NextResponse("Contact not found", { status: 404 })
  }

  await prisma.emergencyContact.delete({
    where: { id: BigInt(contactId) }
  })

  return new NextResponse(null, { status: 204 })
}
