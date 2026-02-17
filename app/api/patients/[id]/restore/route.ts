import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
)
{
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  if (session.user.role !== "ADMIN")
  {
    return new NextResponse("Only admins can restore patients", { status: 403 })
  }

  const { id } = await params
  
  const existingPatient = await prisma.patient.findFirst({
    where: { 
      id: BigInt(id), 
      clinicId: session.user.clinicId,
      deletedAt: { not: null }
    }
  })

  if (!existingPatient)
  {
    return new NextResponse("Patient not found or not deleted", { status: 404 })
  }

  const restored = await prisma.patient.update({
    where: { id: BigInt(id) },
    data: { deletedAt: null }
  })

  return NextResponse.json({
    ...restored,
    id: restored.id.toString(),
    clinicId: restored.clinicId.toString()
  })
}
