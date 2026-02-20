import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "better-auth/crypto"
import { randomUUID } from "crypto"

function generateId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user, clinic } = body

    console.log("Register request:", { userEmail: user?.email, clinicRfc: clinic?.rfc })

    // Validar datos requeridos
    if (!user?.name || !user?.email || !user?.password) {
      console.log("Error: Faltan datos del usuario")
      return NextResponse.json(
        { error: "Faltan datos del usuario" },
        { status: 400 }
      )
    }

    if (!clinic?.name || !clinic?.rfc) {
      console.log("Error: Faltan datos de la clínica")
      return NextResponse.json(
        { error: "Faltan datos de la clínica" },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (existingUser) {
      console.log("Error: Email ya existe:", user.email)
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo electrónico" },
        { status: 400 }
      )
    }

    // Verificar si el RFC ya existe
    const existingClinic = await prisma.clinic.findUnique({
      where: { rfc: clinic.rfc }
    })

    if (existingClinic) {
      console.log("Error: RFC ya existe:", clinic.rfc)
      return NextResponse.json(
        { error: "Ya existe una clínica con este RFC" },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(user.password)
    const userId = generateId('user')

    // Crear todo en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear la clínica
      const newClinic = await tx.clinic.create({
        data: {
          name: clinic.name,
          rfc: clinic.rfc,
          address: clinic.address || null,
          phone: clinic.phone || null,
          email: clinic.email || null,
        }
      })

      // 2. Crear el usuario
      const newUser = await tx.user.create({
        data: {
          id: userId,
          email: user.email,
          name: user.name,
          specialty: user.specialty || null,
          licenseNumber: user.licenseNumber || null,
          phone: user.phone || null,
          isActive: true,
          emailVerified: false,
        }
      })

      // 3. Crear la cuenta (password)
      await tx.account.create({
        data: {
          id: generateId('account'),
          accountId: newUser.id,
          providerId: 'credential',
          userId: newUser.id,
          password: hashedPassword,
        }
      })

      // 4. Crear la relación usuario-clínica con rol ADMIN
      // El ADMIN tiene permisos completos: gestionar clínica Y atender pacientes
      await tx.userClinic.create({
        data: {
          userId: newUser.id,
          clinicId: newClinic.id,
          role: 'ADMIN',
        }
      })

      return { user: newUser, clinic: newClinic }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      clinic: {
        id: result.clinic.id.toString(),
        name: result.clinic.name,
      },
    })
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    )
  }
}
