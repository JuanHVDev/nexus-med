import { auth } from "@/lib/auth"
import { getUserClinicId, getUserRole } from "@/lib/clinic"
import {
  labOrderService,
  LabOrderNotFoundError,
} from "@/lib/domain/lab-orders"
import { labResultCreateSchema } from "@/lib/validations/lab-order"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function POST(
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
  const validation = labResultCreateSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { message: "Validation error", errors: validation.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const results = await labOrderService.addResults(
      BigInt(id),
      BigInt(clinicId),
      validation.data.results,
      session.user.id
    )

    return NextResponse.json(
      results.map((r) => ({
        ...r,
        resultDate: r.resultDate?.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof LabOrderNotFoundError) {
      return NextResponse.json({ message: "Lab order not found" }, { status: 404 })
    }
    throw error
  }
}
