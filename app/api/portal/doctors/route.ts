import { NextResponse } from 'next/server'
import { getPortalSession } from '@/lib/portal/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getPortalSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        isActive: true,
        userClinics: {
          some: { clinicId: session.clinicId }
        }
      },
      select: {
        id: true,
        name: true,
        specialty: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ doctors })
  } catch (error) {
    console.error('Error fetching doctors:', error)
    return NextResponse.json(
      { error: 'Error al obtener doctores' },
      { status: 500 }
    )
  }
}
