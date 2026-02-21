import { auth } from "@/lib/auth"
import { getUserClinicId } from "@/lib/clinic"
import { appointmentService } from "@/lib/domain/appointments"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { searchParams } = new URL(request.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  const doctorId = searchParams.get("doctorId") || undefined

  if (!start || !end) {
    return new NextResponse("Fechas de inicio y fin requeridas", { status: 400 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("Clinic not found", { status: 403 })

  const events = await appointmentService.getCalendarEvents(
    clinicId,
    new Date(start),
    new Date(end),
    doctorId
  )

  return NextResponse.json(events)
}
