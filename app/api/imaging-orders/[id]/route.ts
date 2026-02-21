import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import {
  imagingOrderService,
  ImagingOrderNotFoundError,
} from "@/lib/domain/imaging-orders"
import { imagingOrderUpdateSchema } from "@/lib/validations/imaging-order"
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
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const imagingOrder = await imagingOrderService.getById(
      BigInt(id),
      BigInt(clinicId),
      session.user.id
    )

    return NextResponse.json({
      ...imagingOrder,
      orderDate: imagingOrder.orderDate.toISOString(),
      completedAt: imagingOrder.completedAt?.toISOString() ?? null,
      createdAt: imagingOrder.createdAt.toISOString(),
      updatedAt: imagingOrder.updatedAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof ImagingOrderNotFoundError) {
      return NextResponse.json({ message: "Imaging order not found" }, { status: 404 })
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
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const allowedRoles = ["ADMIN", "DOCTOR"]
  const role = await getUserRole(session.user.id)
  if (!allowedRoles.includes(role ?? "")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const validation = imagingOrderUpdateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { message: "Validation error", errors: validation.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const imagingOrder = await imagingOrderService.update(
      BigInt(id),
      BigInt(clinicId),
      {
        status: validation.data.status,
        reportUrl: validation.data.reportUrl ?? undefined,
        imagesUrl: validation.data.imagesUrl ?? undefined,
        reportFileName: validation.data.reportFileName ?? undefined,
        imagesFileName: validation.data.imagesFileName ?? undefined,
        findings: validation.data.findings,
        impression: validation.data.impression,
      },
      session.user.id
    )

    return NextResponse.json({
      ...imagingOrder,
      orderDate: imagingOrder.orderDate.toISOString(),
      completedAt: imagingOrder.completedAt?.toISOString() ?? null,
      createdAt: imagingOrder.createdAt.toISOString(),
      updatedAt: imagingOrder.updatedAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof ImagingOrderNotFoundError) {
      return NextResponse.json({ message: "Imaging order not found" }, { status: 404 })
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
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const allowedRoles = ["ADMIN", "DOCTOR"]
  const role = await getUserRole(session.user.id)
  if (!allowedRoles.includes(role ?? "")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  try {
    await imagingOrderService.delete(BigInt(id), BigInt(clinicId), session.user.id)
    return NextResponse.json({ message: "Imaging order deleted" })
  } catch (error) {
    if (error instanceof ImagingOrderNotFoundError) {
      return NextResponse.json({ message: "Imaging order not found" }, { status: 404 })
    }
    throw error
  }
}
