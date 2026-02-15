import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { searchParams } = new URL(request.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  const doctorId = searchParams.get("doctorId")

  if (!start || !end) {
    return new NextResponse("Fechas de inicio y fin requeridas", { status: 400 })
  }

  const where: Record<string, unknown> = {
    clinicId: session.user.clinicId,
    startTime: {
      gte: new Date(start),
      lte: new Date(end)
    }
  }

  if (doctorId) {
    where.doctorId = doctorId
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { startTime: 'asc' },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          middleName: true,
        }
      },
      doctor: {
        select: {
          id: true,
          name: true,
          specialty: true,
        }
      }
    }
  })

  const events = appointments.map(apt => {
    const patientName = `${apt.patient.firstName}${apt.patient.middleName ? ' ' + apt.patient.middleName : ''} ${apt.patient.lastName}`
    const doctorName = apt.doctor.name
    
    let backgroundColor = "#3b82f6"
    switch (apt.status) {
      case "SCHEDULED":
        backgroundColor = "#3b82f6"
        break
      case "CONFIRMED":
        backgroundColor = "#10b981"
        break
      case "IN_PROGRESS":
        backgroundColor = "#f59e0b"
        break
      case "COMPLETED":
        backgroundColor = "#6b7280"
        break
      case "CANCELLED":
        backgroundColor = "#ef4444"
        break
      case "NO_SHOW":
        backgroundColor = "#dc2626"
        break
    }

    return {
      id: apt.id.toString(),
      title: `${patientName} - Dr. ${doctorName}`,
      start: apt.startTime.toISOString(),
      end: apt.endTime.toISOString(),
      resource: {
        appointmentId: apt.id.toString(),
        patientId: apt.patientId.toString(),
        patientName,
        doctorId: apt.doctorId,
        doctorName,
        status: apt.status,
        reason: apt.reason,
      },
      backgroundColor,
      borderColor: backgroundColor,
    }
  })

  return NextResponse.json(events)
}
