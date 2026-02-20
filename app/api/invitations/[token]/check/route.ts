import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

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
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    })

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        clinicName: invitation.clinic.name,
        status: invitation.status,
        expiresAt: invitation.expiresAt.toISOString(),
      },
      existingUser: !!existingUser,
    })
  } catch (error) {
    console.error("Error checking invitation:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
