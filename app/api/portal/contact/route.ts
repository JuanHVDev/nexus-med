import { NextResponse } from 'next/server'
import { getPortalSession } from '@/lib/portal/auth'

export async function POST(request: Request) {
  try {
    const session = await getPortalSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, message } = body

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Asunto y mensaje son requeridos' },
        { status: 400 }
      )
    }

    // In a real app, this would send an email to the clinic
    // For now, we'll just log it and return success
    console.log('Patient contact form:', {
      patientId: session.patientId,
      patientName: session.name,
      email: session.email,
      subject,
      message
    })

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado correctamente'
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    )
  }
}
