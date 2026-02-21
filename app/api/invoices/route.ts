import { auth } from '@/lib/auth'
import { getUserClinicId } from '@/lib/clinic'
import { invoiceService } from '@/lib/domain/invoices'
import { invoiceBaseSchema } from '@/lib/validations/invoice'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const clinicId = await getUserClinicId(session.user.id)
    if (!clinicId) {
      return NextResponse.json({ message: 'No clinic assigned' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status') as "PENDING" | "PAID" | "PARTIAL" | "CANCELLED" | undefined
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const result = await invoiceService.getMany({
      clinicId,
      patientId: patientId ? BigInt(patientId) : undefined,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }, page, limit)

    return NextResponse.json({
      data: result.invoices.map(inv => ({
        ...inv,
        id: inv.id.toString(),
        clinicId: inv.clinicId.toString(),
        patientId: inv.patientId.toString(),
        issueDate: inv.issueDate.toISOString(),
        dueDate: inv.dueDate?.toISOString() ?? null,
        subtotal: inv.subtotal,
        tax: inv.tax,
        discount: inv.discount,
        total: inv.total,
        patient: {
          ...inv.patient,
          id: inv.patient.id.toString(),
        },
        issuedBy: inv.issuedBy,
        items: inv.items.map(item => ({
          ...item,
          id: item.id.toString(),
          invoiceId: item.invoiceId.toString(),
          serviceId: item.serviceId?.toString() ?? null,
        })),
        payments: inv.payments.map(pay => ({
          id: pay.id.toString(),
          invoiceId: pay.invoiceId.toString(),
          amount: pay.amount,
          method: pay.method,
          paymentDate: pay.paymentDate.toISOString(),
        })),
        totalPaid: inv.payments.reduce((sum, pay) => sum + pay.amount, 0),
      })),
      pagination: { page, limit, total: result.total, pages: result.pages },
      summary: result.summary,
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ message: 'Error fetching invoices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const clinicId = await getUserClinicId(session.user.id)
    if (!clinicId) {
      return NextResponse.json({ message: 'No clinic assigned' }, { status: 403 })
    }

    const body = await request.json()
    const validation = invoiceBaseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { patientId, dueDate, notes, items } = validation.data

    const result = await invoiceService.create({
      patientId: BigInt(patientId),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes,
      items: items.map(item => ({
        serviceId: item.serviceId ? BigInt(item.serviceId) : undefined,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: (item.quantity * item.unitPrice) - item.discount,
      })),
    }, clinicId, session.user.id)

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 })
    }

    const invoice = result.invoice
    return NextResponse.json({
      ...invoice,
      id: invoice.id.toString(),
      clinicId: invoice.clinicId.toString(),
      patientId: invoice.patientId.toString(),
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString() ?? null,
      patient: {
        ...invoice.patient,
        id: invoice.patient.id.toString(),
      },
      issuedBy: invoice.issuedBy,
      items: invoice.items.map(item => ({
        ...item,
        id: item.id.toString(),
        invoiceId: item.invoiceId.toString(),
        serviceId: item.serviceId?.toString() ?? null,
      })),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ message: 'Error creating invoice' }, { status: 500 })
  }
}
