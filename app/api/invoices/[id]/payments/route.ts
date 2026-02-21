import { auth } from '@/lib/auth'
import { getUserClinicId } from '@/lib/clinic'
import { invoiceService } from '@/lib/domain/invoices'
import { paymentSchema } from '@/lib/validations/invoice'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const clinicId = await getUserClinicId(session.user.id)
    if (!clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = paymentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { amount, method, reference, notes } = validation.data

    const result = await invoiceService.addPayment(
      BigInt(id),
      clinicId,
      {
        amount,
        method,
        reference,
        notes,
      },
      session.user.id
    )

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 })
    }

    const payment = result.payment
    return NextResponse.json({
      ...payment,
      id: payment.id.toString(),
      invoiceId: payment.invoiceId.toString(),
      paymentDate: payment.paymentDate.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ message: 'Error creating payment' }, { status: 500 })
  }
}
