import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"

const updateDoctorSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  specialty: z.string().optional(),
  licenseNumber: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
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

  const doctors = await prisma.user.findMany({
    where: { 
      clinicId: session.user.clinicId,
      role: "DOCTOR",
    },
    select: {
      id: true,
      name: true,
      email: true,
      specialty: true,
      licenseNumber: true,
      phone: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          appointments: true,
          medicalNotes: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ doctors: serializeBigInt(doctors) })
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

  // Only admins can update doctors
  if (session.user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  try {
    const body = await request.json()
    const { doctorId, ...data } = body
    const validated = updateDoctorSchema.parse(data)

    const doctor = await prisma.user.update({
      where: { 
        id: doctorId,
        clinicId: session.user.clinicId,
        role: "DOCTOR",
      },
      data: validated,
      select: {
        id: true,
        name: true,
        email: true,
        specialty: true,
        licenseNumber: true,
        phone: true,
        isActive: true,
      },
    })

    return NextResponse.json(serializeBigInt(doctor))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error updating doctor:", error)
    return NextResponse.json(
      { error: "Error al actualizar el médico" },
      { status: 500 }
    )
  }
}
