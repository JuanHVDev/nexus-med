import { NextResponse } from 'next/server'
import { getPortalSession } from '@/lib/portal/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña requeridos' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const response = await fetch(`${appUrl}/api/auth/signIn/emailPassword`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || 'Email o contraseña incorrectos' },
        { status: 401 }
      )
    }

    const session = await getPortalSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'No tienes acceso al portal de pacientes' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        patientName: session.patientName,
        patientId: session.patientId,
        clinicName: session.clinicName,
      }
    })
  } catch (error) {
    console.error('Portal login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
