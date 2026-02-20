import { auth } from '@/lib/auth'
import { getUserClinicId } from '@/lib/clinic'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { paymentSchema } from '@/lib/validations/invoice'

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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: BigInt(id),
        clinicId: BigInt(clinicId),
      },
      include: {
        payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'CANCELLED') {
      return NextResponse.json(
        { message: 'No se puede pagar una factura cancelada' },
        { status: 400 }
      )
    }

    const { amount, method, reference, notes } = validation.data

    const totalPaid = invoice.payments.reduce((sum, pay) => sum + Number(pay.amount), 0)
    const newTotalPaid = totalPaid + amount

    let invoiceStatus = invoice.status
    if (newTotalPaid >= Number(invoice.total)) {
      invoiceStatus = 'PAID'
    } else if (newTotalPaid > 0) {
      invoiceStatus = 'PARTIAL'
    }

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId: BigInt(id),
          amount,
          method,
          reference,
          notes,
          paymentDate: new Date(),
        },
      }),
      prisma.invoice.update({
        where: { id: BigInt(id) },
        data: { status: invoiceStatus },
      }),
    ])

    return NextResponse.json({
      ...payment,
      id: payment.id.toString(),
      invoiceId: payment.invoiceId.toString(),
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ message: 'Error creating payment' }, { status: 500 })
  }
}
