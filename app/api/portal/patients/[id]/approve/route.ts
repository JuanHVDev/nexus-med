import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    await prisma.user.update({
      where: { id },
      data: { isActive: true }
    })

    return NextResponse.redirect(new URL('/settings/portal-patients', request.url))
  } catch (error) {
    console.error('Error approving patient:', error)
    return NextResponse.json(
      { error: 'Error al aprobar paciente' },
      { status: 500 }
    )
  }
}
