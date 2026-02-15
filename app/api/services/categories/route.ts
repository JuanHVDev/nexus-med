import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  color: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.serviceCategory.findMany({
      where: { clinicId: BigInt(session.user.clinicId) },
      include: {
        services: {
          select: {
            id: true,
            name: true,
            isActive: true,
          }
        }
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({
      categories: categories.map(c => ({
        ...c,
        id: c.id.toString(),
        clinicId: c.clinicId.toString(),
      }))
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ message: 'Error fetching categories' }, { status: 500 })
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

    const allowedRoles = ['ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = categorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, description, color } = validation.data

    const maxOrder = await prisma.serviceCategory.findFirst({
      where: { clinicId: BigInt(session.user.clinicId) },
      orderBy: { sortOrder: 'desc' },
    })

    const category = await prisma.serviceCategory.create({
      data: {
        clinicId: BigInt(session.user.clinicId),
        name,
        description,
        color,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    })

    return NextResponse.json({
      ...category,
      id: category.id.toString(),
      clinicId: category.clinicId.toString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ message: 'Error creating category' }, { status: 500 })
  }
}
