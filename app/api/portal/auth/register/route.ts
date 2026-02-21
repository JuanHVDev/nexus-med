import { NextResponse } from 'next/server'
import { portalRegisterSchema, portalRegister } from '@/lib/portal/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = portalRegisterSchema.parse(body)

    const result = await portalRegister({
      email: validated.email,
      password: validated.password,
      firstName: validated.firstName,
      lastName: validated.lastName,
      phone: validated.phone,
      curp: validated.curp,
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      )
    }
    console.error('Portal register error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
