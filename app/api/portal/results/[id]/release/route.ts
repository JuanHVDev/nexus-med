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
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    await prisma.resultRelease.create({
      data: {
        releasedBy: session.user.id,
        ...(type === 'lab' 
          ? { labOrderId: BigInt(id) }
          : { imagingOrderId: BigInt(id) }
        )
      }
    })

    return NextResponse.redirect(new URL('/settings/portal-results', request.url))
  } catch (error) {
    console.error('Error releasing result:', error)
    return NextResponse.json(
      { error: 'Error al liberar resultado' },
      { status: 500 }
    )
  }
}
