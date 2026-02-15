import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { labOrderCreateSchema } from '@/lib/validations/lab-order'

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
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const where: Record<string, unknown> = {
      clinicId: BigInt(session.user.clinicId),
    }

    if (patientId) where.patientId = BigInt(patientId)
    if (status) where.status = status
    if (doctorId) where.doctorId = doctorId
    
    if (fromDate || toDate) {
      where.orderDate = {}
      if (fromDate) (where.orderDate as Record<string, Date>).gte = new Date(fromDate)
      if (toDate) (where.orderDate as Record<string, Date>).lte = new Date(toDate)
    }

    const labOrders = await prisma.labOrder.findMany({
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
        results: true,
      },
      orderBy: {
        orderDate: 'desc',
      },
    })

    return NextResponse.json(labOrders.map(order => ({
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
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      results: order.results.map(r => ({
        ...r,
        id: r.id.toString(),
        labOrderId: r.labOrderId.toString(),
      })),
    })))
  } catch (error) {
    console.error('Error fetching lab orders:', error)
    return NextResponse.json({ message: 'Error fetching lab orders' }, { status: 500 })
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
    const validation = labOrderCreateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { patientId, doctorId, medicalNoteId, tests, instructions } = validation.data

    const labOrder = await prisma.labOrder.create({
      data: {
        clinicId: BigInt(session.user.clinicId),
        patientId: BigInt(patientId),
        doctorId: doctorId,
        medicalNoteId: medicalNoteId ? BigInt(medicalNoteId) : null,
        tests,
        instructions: instructions ?? null,
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
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating lab order:', error)
    return NextResponse.json({ message: 'Error creating lab order' }, { status: 500 })
  }
}
