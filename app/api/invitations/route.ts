import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserClinic } from "@/lib/clinic"
import { sendInvitationEmail } from "@/lib/email/send-invitation"
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { randomUUID } from "crypto"

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userClinic = await getUserClinic(session.user.id)

    if (!userClinic) {
      return NextResponse.json(
        { error: "No tienes una clínica asignada" },
        { status: 403 }
      )
    }

    // Solo ADMIN puede ver invitaciones
    if (userClinic.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "No tienes permisos para ver invitaciones" },
        { status: 403 }
      )
    }

    const invitations = await prisma.clinicInvitation.findMany({
      where: {
        clinicId: userClinic.clinicId,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      invitations: invitations.map(inv => ({
        id: inv.id.toString(),
        email: inv.email,
        role: inv.role,
        status: inv.status,
        token: inv.token,
        expiresAt: inv.expiresAt.toISOString(),
        acceptedAt: inv.acceptedAt?.toISOString() || null,
        createdAt: inv.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userClinic = await getUserClinic(session.user.id)

    if (!userClinic) {
      return NextResponse.json(
        { error: "No tienes una clínica asignada" },
        { status: 403 }
      )
    }

    // Solo ADMIN puede enviar invitaciones
    if (userClinic.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "No tienes permisos para enviar invitaciones" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email y rol son requeridos" },
        { status: 400 }
      )
    }

    // Validar que el rol sea válido
    const validRoles = ['DOCTOR', 'NURSE', 'RECEPTIONIST']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rol inválido. Debe ser DOCTOR, NURSE o RECEPTIONIST" },
        { status: 400 }
      )
    }

    // Verificar si ya existe una invitación pendiente para este email
    const existingInvitation = await prisma.clinicInvitation.findFirst({
      where: {
        email,
        clinicId: userClinic.clinicId,
        status: 'PENDING',
      },
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Ya existe una invitación pendiente para este email" },
        { status: 400 }
      )
    }

    // Crear la invitación
    const token = randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expira en 7 días

    const invitation = await prisma.clinicInvitation.create({
      data: {
        email,
        clinicId: userClinic.clinicId,
        role,
        invitedBy: session.user.id,
        token,
        expiresAt,
      },
    })

    // Enviar email con el link de invitación
    try {
      await sendInvitationEmail({
        email,
        token,
        clinicName: userClinic.clinic.name,
        role,
        invitedByName: session.user.name,
      })
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError)
      // No fallamos la request si el email falla, solo lo registramos
      // La invitación ya fue creada y puede ser reenviada
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id.toString(),
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expiresAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error creating invitation:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
