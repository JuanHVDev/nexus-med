import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const serviceUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  basePrice: z.number().min(0).optional(),
  duration: z.number().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const service = await prisma.service.findFirst({
      where: {
        id: BigInt(id),
        clinicId: BigInt(session.user.clinicId),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    })

    if (!service) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...service,
      id: service.id.toString(),
      clinicId: service.clinicId.toString(),
      categoryId: service.categoryId?.toString() ?? null,
      basePrice: Number(service.basePrice),
      category: service.category ? {
        ...service.category,
        id: service.category.id.toString(),
      } : null,
    })
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json({ message: 'Error fetching service' }, { status: 500 })
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
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = serviceUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await prisma.service.findFirst({
      where: {
        id: BigInt(id),
        clinicId: BigInt(session.user.clinicId),
      },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (validation.data.name !== undefined) updateData.name = validation.data.name
    if (validation.data.description !== undefined) updateData.description = validation.data.description
    if (validation.data.categoryId !== undefined) updateData.categoryId = validation.data.categoryId ? BigInt(validation.data.categoryId) : null
    if (validation.data.basePrice !== undefined) updateData.basePrice = validation.data.basePrice
    if (validation.data.duration !== undefined) updateData.duration = validation.data.duration
    if (validation.data.isActive !== undefined) updateData.isActive = validation.data.isActive

    const service = await prisma.service.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    })

    return NextResponse.json({
      ...service,
      id: service.id.toString(),
      clinicId: service.clinicId.toString(),
      categoryId: service.categoryId?.toString() ?? null,
      basePrice: Number(service.basePrice),
      category: service.category ? {
        ...service.category,
        id: service.category.id.toString(),
      } : null,
    })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json({ message: 'Error updating service' }, { status: 500 })
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
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.service.findFirst({
      where: {
        id: BigInt(id),
        clinicId: BigInt(session.user.clinicId),
      },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 })
    }

    await prisma.service.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({ message: 'Service deleted' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ message: 'Error deleting service' }, { status: 500 })
  }
}
