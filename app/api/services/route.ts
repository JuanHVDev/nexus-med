import { auth } from '@/lib/auth'
import { getUserClinicId, getUserRole } from '@/lib/clinic'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const serviceSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  basePrice: z.number().min(0),
  duration: z.number().optional(),
  isActive: z.boolean().default(true),
})

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const specialty = searchParams.get('specialty')
    const activeOnly = searchParams.get('active') !== 'false'

    const where: Record<string, unknown> = {
      clinicId,
    }

    if (categoryId) {
      where.categoryId = BigInt(categoryId)
    }

    if (specialty) {
      where.specialty = specialty
    }

    if (activeOnly) {
      where.isActive = true
    }

    const [services, categories] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: [
          { category: { sortOrder: 'asc' } },
          { name: 'asc' },
        ],
      }),
      prisma.serviceCategory.findMany({
        where: { clinicId, isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ])

    return NextResponse.json({
      services: services.map(s => ({
        ...s,
        id: s.id.toString(),
        clinicId: s.clinicId.toString(),
        categoryId: s.categoryId?.toString() ?? null,
        basePrice: Number(s.basePrice),
        category: s.category ? {
          ...s.category,
          id: s.category.id.toString(),
        } : null,
      })),
      categories: categories.map(c => ({
        ...c,
        id: c.id.toString(),
        clinicId: c.clinicId.toString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ message: 'Error fetching services' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const [clinicId, role] = await Promise.all([
      getUserClinicId(session.user.id),
      getUserRole(session.user.id),
    ])
    
    if (!clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['ADMIN']
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = serviceSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, description, categoryId, basePrice, duration, isActive } = validation.data

    const service = await prisma.service.create({
      data: {
        clinicId,
        name,
        description,
        categoryId: categoryId ? BigInt(categoryId) : null,
        basePrice,
        duration,
        isActive,
      },
    })

    return NextResponse.json({
      ...service,
      id: service.id.toString(),
      clinicId: service.clinicId.toString(),
      categoryId: service.categoryId?.toString() ?? null,
      basePrice: Number(service.basePrice),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json({ message: 'Error creating service' }, { status: 500 })
  }
}
