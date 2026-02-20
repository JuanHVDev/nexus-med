import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import { patientSchema } from "@/lib/validations/patient"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) {
    return new NextResponse("No clinic assigned", { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const search = searchParams.get("search") || ""

  const where = {
    clinicId,
    deletedAt: null,
    OR: search ? [
      { firstName: { contains: search, mode: 'insensitive' as const } },
      { lastName: { contains: search, mode: 'insensitive' as const } },
      { curp: { contains: search, mode: 'insensitive' as const } },
      { phone: { contains: search } },
    ] : undefined
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { medicalHistory: true }
    }),
    prisma.patient.count({ where })
  ])

  return NextResponse.json({
    data: patients.map(p => ({
      ...p,
      id: p.id.toString(),
      clinicId: p.clinicId.toString(),
      medicalHistory: p.medicalHistory ? {
        ...p.medicalHistory,
        id: p.medicalHistory.id.toString(),
        patientId: p.medicalHistory.patientId.toString()
      } : null
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  })
}

export async function POST(request: Request) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const clinicId = await getUserClinicId(session.user.id)
  const userRole = await getUserRole(session.user.id)

  if (!clinicId) {
    return new NextResponse("No clinic assigned", { status: 403 })
  }

  // Verificar rol tiene permisos
  const allowedRoles = ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]
  if (!userRole || !allowedRoles.includes(userRole)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const body = await request.json()
  const validated = patientSchema.parse(body)

  // Verificar CURP único en la clínica
  if (validated.curp) {
    const existing = await prisma.patient.findFirst({
      where: { clinicId, curp: validated.curp }
    })
    if (existing) {
      return new NextResponse("CURP ya registrada", { status: 400 })
    }
  }

  const patient = await prisma.patient.create({
    data: {
      ...validated,
      clinicId
    }
  })

  return NextResponse.json({
    ...patient,
    id: patient.id.toString(),
    clinicId: patient.clinicId.toString()
  }, { status: 201 })
}
