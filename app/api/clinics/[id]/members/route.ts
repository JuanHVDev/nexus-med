import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params
    const clinicId = BigInt(id)

    // Verificar que el usuario pertenece a esta clínica
    const userClinic = await prisma.userClinic.findFirst({
      where: {
        userId: session.user.id,
        clinicId,
      },
    })

    if (!userClinic) {
      return NextResponse.json(
        { error: "No tienes acceso a esta clínica" },
        { status: 403 }
      )
    }

    // Obtener todos los miembros
    const members = await prisma.userClinic.findMany({
      where: { clinicId },
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
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })

    return NextResponse.json({
      members: members.map(m => ({
        id: m.id.toString(),
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        specialty: m.user.specialty,
        licenseNumber: m.user.licenseNumber,
        phone: m.user.phone,
        isActive: m.user.isActive,
        joinedAt: m.joinedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Error fetching members:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params
    const clinicId = BigInt(id)

    // Verificar que el usuario es ADMIN de esta clínica
    const userClinic = await prisma.userClinic.findFirst({
      where: {
        userId: session.user.id,
        clinicId,
        role: 'ADMIN',
      },
    })

    if (!userClinic) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar miembros" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { memberId } = body

    // No puede eliminarse a sí mismo
    const memberToDelete = await prisma.userClinic.findFirst({
      where: {
        id: BigInt(memberId),
        clinicId,
      },
    })

    if (!memberToDelete) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      )
    }

    if (memberToDelete.userId === session.user.id) {
      return NextResponse.json(
        { error: "No puedes eliminarte a ti mismo" },
        { status: 400 }
      )
    }

    // Eliminar miembro
    await prisma.userClinic.delete({
      where: { id: BigInt(memberId) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting member:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
