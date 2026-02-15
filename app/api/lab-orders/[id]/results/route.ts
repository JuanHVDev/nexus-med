import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { labResultCreateSchema } from '@/lib/validations/lab-order'

export async function POST(
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

    const allowedRoles = ['ADMIN', 'DOCTOR']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = labResultCreateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await prisma.labOrder.findFirst({
      where: {
        id: BigInt(id),
        clinicId: BigInt(session.user.clinicId),
      },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Lab order not found' }, { status: 404 })
    }

    const { results } = validation.data

    const createdResults = await Promise.all(
      results.map(async (result) => {
        return prisma.labResult.create({
          data: {
            labOrderId: BigInt(id),
            testName: result.testName,
            result: result.result ?? null,
            unit: result.unit ?? null,
            referenceRange: result.referenceRange ?? null,
            flag: result.flag ?? null,
            resultDate: result.result ? new Date() : null,
          },
        })
      })
    )

    await prisma.labOrder.update({
      where: { id: BigInt(id) },
      data: { status: 'COMPLETED' },
    })

    return NextResponse.json(createdResults.map(r => ({
      ...r,
      id: r.id.toString(),
      labOrderId: r.labOrderId.toString(),
    })), { status: 201 })
  } catch (error) {
    console.error('Error creating lab results:', error)
    return NextResponse.json({ message: 'Error creating lab results' }, { status: 500 })
  }
}
