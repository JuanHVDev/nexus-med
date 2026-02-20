import { auth } from '@/lib/auth'
import { getUserClinicId, getUserRole } from '@/lib/clinic'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { imagingOrderUpdateSchema } from '@/lib/validations/imaging-order'

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
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const imagingOrder = await prisma.imagingOrder.findFirst({
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
      },
    })

    if (!imagingOrder) {
      return NextResponse.json({ message: 'Imaging order not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...imagingOrder,
      id: imagingOrder.id.toString(),
      clinicId: imagingOrder.clinicId.toString(),
      patientId: imagingOrder.patientId.toString(),
      doctorId: imagingOrder.doctorId,
      medicalNoteId: imagingOrder.medicalNoteId?.toString() ?? null,
      patient: imagingOrder.patient ? {
        ...imagingOrder.patient,
        id: imagingOrder.patient.id.toString(),
        birthDate: imagingOrder.patient.birthDate.toISOString(),
      } : null,
      orderDate: imagingOrder.orderDate.toISOString(),
      completedAt: imagingOrder.completedAt?.toISOString() ?? null,
      createdAt: imagingOrder.createdAt.toISOString(),
      updatedAt: imagingOrder.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching imaging order:', error)
    return NextResponse.json({ message: 'Error fetching imaging order' }, { status: 500 })
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
    const role = await getUserRole(session.user.id)
    if (!clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['ADMIN', 'DOCTOR']
    if (!allowedRoles.includes(role ?? '')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = imagingOrderUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await prisma.imagingOrder.findFirst({
      where: {
        id: BigInt(id),
        clinicId: BigInt(clinicId),
      },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Imaging order not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (validation.data.status !== undefined) {
      updateData.status = validation.data.status
      if (validation.data.status === 'COMPLETED') {
        updateData.completedAt = new Date()
      }
    }
    if (validation.data.reportUrl !== undefined) updateData.reportUrl = validation.data.reportUrl
    if (validation.data.imagesUrl !== undefined) updateData.imagesUrl = validation.data.imagesUrl
    if (validation.data.reportFileName !== undefined) updateData.reportFileName = validation.data.reportFileName
    if (validation.data.imagesFileName !== undefined) updateData.imagesFileName = validation.data.imagesFileName
    if (validation.data.findings !== undefined) updateData.findings = validation.data.findings
    if (validation.data.impression !== undefined) updateData.impression = validation.data.impression

    const imagingOrder = await prisma.imagingOrder.update({
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
      },
    })

    return NextResponse.json({
      ...imagingOrder,
      id: imagingOrder.id.toString(),
      clinicId: imagingOrder.clinicId.toString(),
      patientId: imagingOrder.patientId.toString(),
      doctorId: imagingOrder.doctorId,
      medicalNoteId: imagingOrder.medicalNoteId?.toString() ?? null,
      patient: imagingOrder.patient ? {
        ...imagingOrder.patient,
        id: imagingOrder.patient.id.toString(),
      } : null,
      orderDate: imagingOrder.orderDate.toISOString(),
      completedAt: imagingOrder.completedAt?.toISOString() ?? null,
      createdAt: imagingOrder.createdAt.toISOString(),
      updatedAt: imagingOrder.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Error updating imaging order:', error)
    return NextResponse.json({ message: 'Error updating imaging order' }, { status: 500 })
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
    const role = await getUserRole(session.user.id)
    if (!clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['ADMIN', 'DOCTOR']
    if (!allowedRoles.includes(role ?? '')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.imagingOrder.findFirst({
      where: {
        id: BigInt(id),
        clinicId: BigInt(clinicId),
      },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Imaging order not found' }, { status: 404 })
    }

    await prisma.imagingOrder.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({ message: 'Imaging order deleted' })
  } catch (error) {
    console.error('Error deleting imaging order:', error)
    return NextResponse.json({ message: 'Error deleting imaging order' }, { status: 500 })
  }
}
