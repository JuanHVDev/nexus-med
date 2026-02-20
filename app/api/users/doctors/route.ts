import { auth } from "@/lib/auth"
import { getUserClinicId } from "@/lib/clinic"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { UserRole } from "@/generated/prisma/client"

export async function GET() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return new NextResponse("Clinic not found", { status: 404 })

  // ADMIN tiene permisos completos incluyendo atender pacientes
  const userClinics = await prisma.userClinic.findMany({
    where: {
      clinicId,
      role: { in: [UserRole.DOCTOR, UserRole.ADMIN] },
      user: { isActive: true },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          specialty: true,
          licenseNumber: true,
        },
      },
    },
    orderBy: { user: { name: 'asc' } }
  })

  const doctors = userClinics.map(uc => uc.user)

  const response = NextResponse.json({
    data: doctors.map(d => ({
      ...d,
      id: d.id
    }))
  })
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return response
}
