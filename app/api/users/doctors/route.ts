import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const doctors = await prisma.user.findMany({
    where: {
      clinicId: session.user.clinicId,
      role: "DOCTOR",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      specialty: true,
      licenseNumber: true,
    },
    orderBy: { name: 'asc' }
  })

  return NextResponse.json({
    data: doctors.map(d => ({
      ...d,
      id: d.id
    }))
  })
}
