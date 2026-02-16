import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"

const createUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]),
  specialty: z.string().optional(),
  licenseNumber: z.string().optional(),
  phone: z.string().optional(),
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

  const users = await prisma.user.findMany({
    where: { clinicId: session.user.clinicId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      specialty: true,
      licenseNumber: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ users: serializeBigInt(users) })
}

export async function POST(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  if (!session.user.clinicId) {
    return new NextResponse("Clinic not found", { status: 404 })
  }

  // Only admins can create users
  if (session.user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  try {
    const body = await request.json()
    const validated = createUserSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Create user with password using Better Auth
    // For now, we'll create the user directly in Prisma
    // In production, you'd use authClient.signUp.email
    
    const user = await prisma.user.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: validated.name,
        email: validated.email,
        role: validated.role,
        specialty: validated.specialty,
        licenseNumber: validated.licenseNumber,
        phone: validated.phone,
        clinicId: session.user.clinicId,
        emailVerified: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        licenseNumber: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json(serializeBigInt(user), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Error al crear el usuario" },
      { status: 500 }
    )
  }
}
