import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"

const clinicSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  rfc: z.string().min(12, "RFC inválido").max(13),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
})

function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  )
}

export async function GET() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  if (!session.user.clinicId) {
    return new NextResponse("Clinic not found", { status: 404 })
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: session.user.clinicId },
  })

  if (!clinic) {
    return new NextResponse("Clinic not found", { status: 404 })
  }

  return NextResponse.json(serializeBigInt(clinic))
}

export async function PUT(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  if (!session.user.clinicId) {
    return new NextResponse("Clinic not found", { status: 404 })
  }

  try {
    const body = await request.json()
    const validated = clinicSchema.parse(body)

    const clinic = await prisma.clinic.update({
      where: { id: session.user.clinicId },
      data: validated,
    })

    return NextResponse.json(serializeBigInt(clinic))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Error al actualizar la clínica" },
      { status: 500 }
    )
  }
}
