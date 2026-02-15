import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { imagingOrderCreateSchema } from '@/lib/validations/imaging-order'

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')
    const doctorId = searchParams.get('doctorId')
    const studyType = searchParams.get('studyType')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const where: Record<string, unknown> = {
      clinicId: BigInt(session.user.clinicId),
    }

    if (patientId) where.patientId = BigInt(patientId)
    if (status) where.status = status
    if (doctorId) where.doctorId = doctorId
    if (studyType) where.studyType = studyType
    
    if (fromDate || toDate) {
      where.orderDate = {}
      if (fromDate) (where.orderDate as Record<string, Date>).gte = new Date(fromDate)
      if (toDate) (where.orderDate as Record<string, Date>).lte = new Date(toDate)
    }

    const imagingOrders = await prisma.imagingOrder.findMany({
      where,
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
      orderBy: {
        orderDate: 'desc',
      },
    })

    return NextResponse.json(imagingOrders.map(order => ({
      ...order,
      id: order.id.toString(),
      clinicId: order.clinicId.toString(),
      patientId: order.patientId.toString(),
      doctorId: order.doctorId,
      medicalNoteId: order.medicalNoteId?.toString() ?? null,
      patient: order.patient ? {
        ...order.patient,
        id: order.patient.id.toString(),
      } : null,
      orderDate: order.orderDate.toISOString(),
      completedAt: order.completedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    })))
  } catch (error) {
    console.error('Error fetching imaging orders:', error)
    return NextResponse.json({ message: 'Error fetching imaging orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['ADMIN', 'DOCTOR']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = imagingOrderCreateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { patientId, doctorId, medicalNoteId, studyType, bodyPart, reason, clinicalNotes } = validation.data

    const imagingOrder = await prisma.imagingOrder.create({
      data: {
        clinicId: BigInt(session.user.clinicId),
        patientId: BigInt(patientId),
        doctorId: doctorId,
        medicalNoteId: medicalNoteId ? BigInt(medicalNoteId) : null,
        studyType,
        bodyPart,
        reason: reason ?? null,
        clinicalNotes: clinicalNotes ?? null,
      },
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
      createdAt: imagingOrder.createdAt.toISOString(),
      updatedAt: imagingOrder.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating imaging order:', error)
    return NextResponse.json({ message: 'Error creating imaging order' }, { status: 500 })
  }
}
