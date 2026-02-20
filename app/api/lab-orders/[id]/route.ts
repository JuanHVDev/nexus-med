import { auth } from '@/lib/auth'
import { getUserClinicId, getUserRole } from '@/lib/clinic'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { labOrderUpdateSchema } from '@/lib/validations/lab-order'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const clinicId = await getUserClinicId(session.user.id)
    if (!clinicId) {
      return NextResponse.json({ message: 'No clinic found' }, { status: 403 })
    }

    const { id } = await params

    const labOrder = await prisma.labOrder.findFirst({
      where: {
        id: BigInt(id),
        clinicId: BigInt(clinicId),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            curp: true,
            birthDate: true,
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            licenseNumber: true,
          }
        },
        results: true,
      },
    })

    if (!labOrder) {
      return NextResponse.json({ message: 'Lab order not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...labOrder,
      id: labOrder.id.toString(),
      clinicId: labOrder.clinicId.toString(),
      patientId: labOrder.patientId.toString(),
      doctorId: labOrder.doctorId,
      medicalNoteId: labOrder.medicalNoteId?.toString() ?? null,
      patient: labOrder.patient ? {
        ...labOrder.patient,
        id: labOrder.patient.id.toString(),
        birthDate: labOrder.patient.birthDate.toISOString(),
      } : null,
      orderDate: labOrder.orderDate.toISOString(),
      createdAt: labOrder.createdAt.toISOString(),
      updatedAt: labOrder.updatedAt.toISOString(),
      results: labOrder.results.map(r => ({
        ...r,
        id: r.id.toString(),
        labOrderId: r.labOrderId.toString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching lab order:', error)
    return NextResponse.json({ message: 'Error fetching lab order' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const clinicId = await getUserClinicId(session.user.id)
    if (!clinicId) {
      return NextResponse.json({ message: 'No clinic found' }, { status: 403 })
    }

    const allowedRoles = ['ADMIN', 'DOCTOR']
    const userRole = await getUserRole(session.user.id)
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = labOrderUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await prisma.labOrder.findFirst({
      where: {
        id: BigInt(id),
        clinicId: BigInt(clinicId),
      },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Lab order not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (validation.data.status !== undefined) updateData.status = validation.data.status
    if (validation.data.instructions !== undefined) updateData.instructions = validation.data.instructions

    const labOrder = await prisma.labOrder.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
          }
        },
        results: true,
      },
    })

    return NextResponse.json({
      ...labOrder,
      id: labOrder.id.toString(),
      clinicId: labOrder.clinicId.toString(),
      patientId: labOrder.patientId.toString(),
      doctorId: labOrder.doctorId,
      medicalNoteId: labOrder.medicalNoteId?.toString() ?? null,
      patient: labOrder.patient ? {
        ...labOrder.patient,
        id: labOrder.patient.id.toString(),
      } : null,
      orderDate: labOrder.orderDate.toISOString(),
      createdAt: labOrder.createdAt.toISOString(),
      updatedAt: labOrder.updatedAt.toISOString(),
      results: labOrder.results.map(r => ({
        ...r,
        id: r.id.toString(),
        labOrderId: r.labOrderId.toString(),
      })),
    })
  } catch (error) {
    console.error('Error updating lab order:', error)
    return NextResponse.json({ message: 'Error updating lab order' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const clinicId = await getUserClinicId(session.user.id)
    if (!clinicId) {
      return NextResponse.json({ message: 'No clinic found' }, { status: 403 })
    }

    const allowedRoles = ['ADMIN', 'DOCTOR']
    const userRole = await getUserRole(session.user.id)
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.labOrder.findFirst({
      where: {
        id: BigInt(id),
        clinicId: BigInt(clinicId),
      },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Lab order not found' }, { status: 404 })
    }

    await prisma.labOrder.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({ message: 'Lab order deleted' })
  } catch (error) {
    console.error('Error deleting lab order:', error)
    return NextResponse.json({ message: 'Error deleting lab order' }, { status: 500 })
  }
}
