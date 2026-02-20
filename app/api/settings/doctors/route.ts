import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import { prisma } from "@/lib/prisma"
import { serializeBigInt } from "@/lib/utils"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { UserRole } from "@/generated/prisma/client"

const updateDoctorSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  specialty: z.string().optional(),
  licenseNumber: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) {
    return new NextResponse("Clinic not found", { status: 404 })
  }

  // ADMIN tiene permisos completos incluyendo atender pacientes
  const userClinics = await prisma.userClinic.findMany({
    where: { 
      clinicId,
      role: { in: [UserRole.DOCTOR, UserRole.ADMIN] },
    },
    include: {
      user: {
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
      },
    },
    orderBy: { user: { name: "asc" } },
  })

  const doctors = userClinics.map(uc => uc.user)

  return NextResponse.json({ doctors: serializeBigInt(doctors) })
}

export async function PUT(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const [clinicId, role] = await Promise.all([
    getUserClinicId(session.user.id),
    getUserRole(session.user.id),
  ])

  if (!clinicId) {
    return new NextResponse("Clinic not found", { status: 404 })
  }

  // Only admins can update doctors
  if (role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  try {
    const body = await request.json()
    const { doctorId, ...data } = body
    const validated = updateDoctorSchema.parse(data)

    // Verify the doctor belongs to the same clinic (ADMIN or DOCTOR)
    const userClinic = await prisma.userClinic.findFirst({
      where: {
        userId: doctorId,
        clinicId,
        role: { in: [UserRole.DOCTOR, UserRole.ADMIN] },
      },
    })

    if (!userClinic) {
      return new NextResponse("Doctor not found", { status: 404 })
    }

    const doctor = await prisma.user.update({
      where: { id: doctorId },
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
