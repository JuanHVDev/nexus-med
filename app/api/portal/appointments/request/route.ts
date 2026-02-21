import { NextResponse } from 'next/server'
import { getPortalSession } from '@/lib/portal/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const appointmentRequestSchema = z.object({
  date: z.string().min(1, 'Fecha requerida'),
  time: z.string().min(1, 'Hora requerida'),
  doctorId: z.string().min(1, 'Doctor requerido'),
  reason: z.string().min(1, 'Motivo requerido'),
})

export async function POST(request: Request) {
  try {
    const session = await getPortalSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = appointmentRequestSchema.parse(body)

    const appointmentDate = new Date(validated.date)
    const [hours, minutes] = validated.time.split(':')
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    const appointmentRequest = await prisma.appointmentRequest.create({
      data: {
        patientId: session.patientId,
        clinicId: session.clinicId,
        requestedDate: appointmentDate,
        requestedTime: validated.time,
        requestedDoctorId: validated.doctorId,
        reason: validated.reason,
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Cita solicitada correctamente',
      request: appointmentRequest
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      )
    }
    console.error('Error requesting appointment:', error)
    return NextResponse.json(
      { error: 'Error al solicitar cita' },
      { status: 500 }
    )
  }
}
