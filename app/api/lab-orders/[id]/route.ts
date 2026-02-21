import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import {
  labOrderService,
  LabOrderNotFoundError,
} from "@/lib/domain/lab-orders"
import { labOrderUpdateSchema } from "@/lib/validations/lab-order"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) {
    return NextResponse.json({ message: "No clinic found" }, { status: 403 })
  }

  const { id } = await params

  try {
    const labOrder = await labOrderService.getById(
      BigInt(id),
      BigInt(clinicId),
      session.user.id
    )

    return NextResponse.json({
      ...labOrder,
      orderDate: labOrder.orderDate.toISOString(),
      createdAt: labOrder.createdAt.toISOString(),
      updatedAt: labOrder.updatedAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof LabOrderNotFoundError) {
      return NextResponse.json({ message: "Lab order not found" }, { status: 404 })
    }
    throw error
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params
  const body = await request.json()
  const validation = labOrderUpdateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { message: "Validation error", errors: validation.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const labOrder = await labOrderService.update(
      BigInt(id),
      BigInt(clinicId),
      {
        status: validation.data.status,
        instructions: validation.data.instructions,
        resultsFileUrl: validation.data.resultsFileUrl ?? undefined,
        resultsFileName: validation.data.resultsFileName ?? undefined,
      },
      session.user.id
    )

    return NextResponse.json({
      ...labOrder,
      orderDate: labOrder.orderDate.toISOString(),
      createdAt: labOrder.createdAt.toISOString(),
      updatedAt: labOrder.updatedAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof LabOrderNotFoundError) {
      return NextResponse.json({ message: "Lab order not found" }, { status: 404 })
    }
    throw error
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  try {
    await labOrderService.delete(BigInt(id), BigInt(clinicId), session.user.id)
    return NextResponse.json({ message: "Lab order deleted" })
  } catch (error) {
    if (error instanceof LabOrderNotFoundError) {
      return NextResponse.json({ message: "Lab order not found" }, { status: 404 })
    }
    throw error
  }
}
