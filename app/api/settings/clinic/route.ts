import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"

const clinicSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
})

async function getCurrentClinic(userId: string) {
  const userClinic = await prisma.userClinic.findFirst({
    where: { userId },
    include: {
      clinic: true,
    },
    orderBy: { joinedAt: 'asc' },
  })
  return userClinic
}

export async function GET() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const userClinic = await getCurrentClinic(session.user.id)

  if (!userClinic) {
    return NextResponse.json(
      { error: "No tienes una clínica asignada" },
      { status: 404 }
    )
  }

  const clinic = userClinic.clinic

  return NextResponse.json({
    id: clinic.id.toString(),
    name: clinic.name,
    rfc: clinic.rfc,
    address: clinic.address,
    phone: clinic.phone,
    email: clinic.email,
    isActive: clinic.isActive,
    role: userClinic.role,
  })
}

export async function PUT(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const userClinic = await getCurrentClinic(session.user.id)

  if (!userClinic) {
    return NextResponse.json(
      { error: "No tienes una clínica asignada" },
      { status: 404 }
    )
  }

  // Verificar si es ADMIN
  if (userClinic.role !== 'ADMIN') {
    return NextResponse.json(
      { error: "No tienes permisos para editar esta clínica" },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const validated = clinicSchema.parse(body)

    const clinic = await prisma.clinic.update({
      where: { id: userClinic.clinicId },
      data: {
        name: validated.name,
        address: validated.address || null,
        phone: validated.phone || null,
        email: validated.email || null,
      },
    })

    return NextResponse.json({
      id: clinic.id.toString(),
      name: clinic.name,
      rfc: clinic.rfc,
      address: clinic.address,
      phone: clinic.phone,
      email: clinic.email,
      isActive: clinic.isActive,
    })
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
