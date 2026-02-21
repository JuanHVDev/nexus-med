import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import {
  imagingOrderService,
  PatientNotFoundError,
} from "@/lib/domain/imaging-orders"
import { imagingOrderCreateSchema } from "@/lib/validations/imaging-order"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get("patientId") ?? undefined
  const doctorId = searchParams.get("doctorId") ?? undefined
  const medicalNoteId = searchParams.get("medicalNoteId") ?? undefined
  const studyType = searchParams.get("studyType") ?? undefined
  const status = searchParams.get("status") as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | undefined
  const fromDate = searchParams.get("fromDate") ? new Date(searchParams.get("fromDate")!) : undefined
  const toDate = searchParams.get("toDate") ? new Date(searchParams.get("toDate")!) : undefined

  const filters = { patientId, doctorId, medicalNoteId, studyType, status, fromDate, toDate }

  const imagingOrders = await imagingOrderService.listByClinic(BigInt(clinicId), filters)

  return NextResponse.json(
    imagingOrders.map((order) => ({
      ...order,
      orderDate: order.orderDate.toISOString(),
      completedAt: order.completedAt?.toISOString() ?? null,
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
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const allowedRoles = ["ADMIN", "DOCTOR"]
  const role = await getUserRole(session.user.id)
  if (!allowedRoles.includes(role ?? "")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const validation = imagingOrderCreateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { message: "Validation error", errors: validation.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { patientId, doctorId, medicalNoteId, studyType, bodyPart, reason, clinicalNotes } = validation.data

  try {
    const imagingOrder = await imagingOrderService.create(
      BigInt(clinicId),
      {
        patientId: BigInt(patientId),
        doctorId,
        medicalNoteId: medicalNoteId ? BigInt(medicalNoteId) : undefined,
        studyType,
        bodyPart,
        reason: reason ?? undefined,
        clinicalNotes: clinicalNotes ?? undefined,
      },
      session.user.id
    )

    return NextResponse.json(
      {
        ...imagingOrder,
        orderDate: imagingOrder.orderDate.toISOString(),
        completedAt: imagingOrder.completedAt?.toISOString() ?? null,
        createdAt: imagingOrder.createdAt.toISOString(),
        updatedAt: imagingOrder.updatedAt.toISOString(),
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
