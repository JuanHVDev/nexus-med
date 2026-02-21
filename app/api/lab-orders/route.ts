import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import {
  labOrderService,
  PatientNotFoundError,
} from "@/lib/domain/lab-orders"
import { labOrderCreateSchema } from "@/lib/validations/lab-order"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) {
    return NextResponse.json({ message: "No clinic found" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get("patientId") ?? undefined
  const doctorId = searchParams.get("doctorId") ?? undefined
  const medicalNoteId = searchParams.get("medicalNoteId") ?? undefined
  const status = searchParams.get("status") as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | undefined
  const fromDate = searchParams.get("fromDate") ? new Date(searchParams.get("fromDate")!) : undefined
  const toDate = searchParams.get("toDate") ? new Date(searchParams.get("toDate")!) : undefined

  const filters = { patientId, doctorId, medicalNoteId, status, fromDate, toDate }

  const labOrders = await labOrderService.listByClinic(BigInt(clinicId), filters)

  return NextResponse.json(
    labOrders.map((order) => ({
      ...order,
      orderDate: order.orderDate.toISOString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }))
  )
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) {
    return NextResponse.json({ message: "No clinic found" }, { status: 403 })
  }

  const allowedRoles = ["ADMIN", "DOCTOR"]
  const userRole = await getUserRole(session.user.id)
  if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const validation = labOrderCreateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { message: "Validation error", errors: validation.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { patientId, doctorId, medicalNoteId, tests, instructions } = validation.data

  try {
    const labOrder = await labOrderService.create(
      BigInt(clinicId),
      {
        patientId: BigInt(patientId),
        doctorId,
        medicalNoteId: medicalNoteId ? BigInt(medicalNoteId) : undefined,
        tests,
        instructions: instructions ?? undefined,
      },
      session.user.id
    )

    return NextResponse.json(
      {
        ...labOrder,
        orderDate: labOrder.orderDate.toISOString(),
        createdAt: labOrder.createdAt.toISOString(),
        updatedAt: labOrder.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof PatientNotFoundError) {
      return NextResponse.json({ message: "Patient not found" }, { status: 404 })
    }
    throw error
  }
}
