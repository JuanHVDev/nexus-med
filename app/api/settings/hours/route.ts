import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"

const hoursSchema = z.object({
  appointmentDuration: z.number().min(15).max(120).optional(),
  workingHours: z.array(
    z.object({
      day: z.number().min(0).max(6),
      enabled: z.boolean(),
      start: z.string().optional(),
      end: z.string().optional(),
    })
  ).optional(),
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
    select: {
      workingHours: true,
      appointmentDuration: true,
    },
  })

  // Default hours if not set
  const defaultHours = {
    workingHours: [
      { day: 0, enabled: false, start: "09:00", end: "18:00" }, // Sunday
      { day: 1, enabled: true, start: "09:00", end: "18:00" },  // Monday
      { day: 2, enabled: true, start: "09:00", end: "18:00" },  // Tuesday
      { day: 3, enabled: true, start: "09:00", end: "18:00" },  // Wednesday
      { day: 4, enabled: true, start: "09:00", end: "18:00" },  // Thursday
      { day: 5, enabled: true, start: "09:00", end: "18:00" },  // Friday
      { day: 6, enabled: false, start: "09:00", end: "14:00" }, // Saturday
    ],
    appointmentDuration: 30,
  }

  return NextResponse.json(serializeBigInt(clinic || defaultHours))
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

  // Only admins can update hours
  if (session.user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  try {
    const body = await request.json()
    const validated = hoursSchema.parse(body)

    const clinic = await prisma.clinic.update({
      where: { id: session.user.clinicId },
      data: {
        workingHours: validated.workingHours,
        appointmentDuration: validated.appointmentDuration,
      },
    })

    return NextResponse.json(serializeBigInt(clinic))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error updating hours:", error)
    return NextResponse.json(
      { error: "Error al actualizar los horarios" },
      { status: 500 }
    )
  }
}
