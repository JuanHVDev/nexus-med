import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { hashPassword } from "better-auth/crypto"
import { randomUUID } from "crypto"

function generateId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { password, name } = body

    // Buscar la invitación
    const invitation = await prisma.clinicInvitation.findUnique({
      where: { token },
      include: { clinic: true },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitación no encontrada" },
        { status: 404 }
      )
    }

    // Verificar si la invitación ya fue aceptada
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json(
        { error: "Esta invitación ya fue aceptada" },
        { status: 400 }
      )
    }

    // Verificar si la invitación expiró
    if (invitation.expiresAt < new Date()) {
      await prisma.clinicInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      })
      return NextResponse.json(
        { error: "Esta invitación ha expirado" },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    let user = await prisma.user.findUnique({
      where: { email: invitation.email },
    })

    if (user) {
      // El usuario ya existe, solo agregarlo a la clínica
      const existingMembership = await prisma.userClinic.findFirst({
        where: {
          userId: user.id,
          clinicId: invitation.clinicId,
        },
      })

      if (existingMembership) {
        return NextResponse.json(
          { error: "Ya eres miembro de esta clínica" },
          { status: 400 }
        )
      }

      await prisma.userClinic.create({
        data: {
          userId: user.id,
          clinicId: invitation.clinicId,
          role: invitation.role,
        },
      })
    } else {
      // El usuario no existe, crear uno nuevo
      if (!password || !name) {
        return NextResponse.json(
          { error: "Nombre y contraseña son requeridos para nuevos usuarios" },
          { status: 400 }
        )
      }

      const hashedPassword = await hashPassword(password)
      const userId = generateId('user')

      await prisma.$transaction(async (tx) => {
        // Crear usuario
        user = await tx.user.create({
          data: {
            id: userId,
            email: invitation.email,
            name,
            isActive: true,
            emailVerified: true,
          },
        })

        // Crear cuenta
        await tx.account.create({
          data: {
            id: generateId('account'),
            accountId: userId,
            providerId: 'credential',
            userId,
            password: hashedPassword,
          },
        })

        // Agregar a la clínica
        await tx.userClinic.create({
          data: {
            userId,
            clinicId: invitation.clinicId,
            role: invitation.role,
          },
        })
      })
    }

    // Marcar invitación como aceptada
    await prisma.clinicInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Te has unido a la clínica exitosamente",
      clinic: {
        id: invitation.clinicId.toString(),
        name: invitation.clinic.name,
      },
    })
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
