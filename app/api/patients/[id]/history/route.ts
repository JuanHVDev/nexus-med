import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
)
{
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { id } = await params

  // Verificar ownership
  const patient = await prisma.patient.findFirst({
    where: { id: BigInt(id), clinicId: BigInt(session.user.clinicId!), deletedAt: null }
  })
  if (!patient) return new NextResponse("Not found", { status: 404 })

  const history = await prisma.medicalHistory.findUnique({
    where: { patientId: BigInt(id) }
  })

  if (!history) return NextResponse.json({})

  return NextResponse.json({
    ...history,
    id: history.id.toString(),
    patientId: history.patientId.toString()
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

  // Solo personal médico puede modificar historial
  if (!["ADMIN", "DOCTOR", "NURSE"].includes(session.user.role))
  {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const history = await prisma.medicalHistory.upsert({
    where: { patientId: BigInt(id) },
    update: body,
    create: { patientId: BigInt(id), ...body }
  })

  return NextResponse.json({
    ...history,
    id: history.id.toString(),
    patientId: history.patientId.toString()
  })
}
