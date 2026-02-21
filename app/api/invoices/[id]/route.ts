import { auth } from '@/lib/auth'
import { getUserClinicId } from '@/lib/clinic'
import { invoiceService } from '@/lib/domain/invoices'
import { invoiceUpdateSchema } from '@/lib/validations/invoice'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
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

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ message: 'Invalid invoice ID' }, { status: 400 })
    }

    const invoice = await invoiceService.getById(BigInt(id), clinicId, session.user.id)

    if (!invoice) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 })
    }

    const totals = invoiceService.calculateTotals(invoice)

    return NextResponse.json({
      id: invoice.id.toString(),
      clinicId: invoice.clinicId.toString(),
      patientId: invoice.patientId.toString(),
      clinicInvoiceNumber: invoice.clinicInvoiceNumber,
      issuedById: invoice.issuedById,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString() ?? null,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount,
      total: invoice.total,
      status: invoice.status,
      notes: invoice.notes,
      patient: {
        id: invoice.patient.id.toString(),
        firstName: invoice.patient.firstName,
        lastName: invoice.patient.lastName,
        middleName: invoice.patient.middleName,
        curp: invoice.patient.curp,
      },
      issuedBy: {
        id: invoice.issuedBy.id,
        name: invoice.issuedBy.name,
        email: invoice.issuedBy.email,
      },
      items: invoice.items.map(item => ({
        id: item.id.toString(),
        invoiceId: item.invoiceId.toString(),
        serviceId: item.serviceId?.toString() ?? null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
      })),
      payments: invoice.payments.map(pay => ({
        id: pay.id.toString(),
        invoiceId: pay.invoiceId.toString(),
        amount: pay.amount,
        method: pay.method,
        reference: pay.reference,
        notes: pay.notes,
        paymentDate: pay.paymentDate.toISOString(),
      })),
      totalPaid: totals.totalPaid,
      balance: totals.balance,
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ message: 'Error fetching invoice' }, { status: 500 })
  }
}

export async function PUT(
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
    const validation = invoiceUpdateSchema.safeParse(body)

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ message: 'Invalid invoice ID' }, { status: 400 })
    }

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { status, dueDate, notes } = validation.data

    const result = await invoiceService.update(BigInt(id), clinicId, {
      status,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes,
    }, session.user.id)

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 404 })
    }

    const invoice = result.invoice
    return NextResponse.json({
      id: invoice.id.toString(),
      clinicId: invoice.clinicId.toString(),
      patientId: invoice.patientId.toString(),
      clinicInvoiceNumber: invoice.clinicInvoiceNumber,
      issuedById: invoice.issuedById,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString() ?? null,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount,
      total: invoice.total,
      status: invoice.status,
      notes: invoice.notes,
      patient: {
        id: invoice.patient.id.toString(),
        firstName: invoice.patient.firstName,
        lastName: invoice.patient.lastName,
        middleName: invoice.patient.middleName,
      },
      issuedBy: invoice.issuedBy,
      items: invoice.items.map(item => ({
        id: item.id.toString(),
        invoiceId: item.invoiceId.toString(),
        serviceId: item.serviceId?.toString() ?? null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
      })),
      payments: invoice.payments.map(pay => ({
        id: pay.id.toString(),
        invoiceId: pay.invoiceId.toString(),
        amount: pay.amount,
        method: pay.method,
        reference: pay.reference,
        notes: pay.notes,
        paymentDate: pay.paymentDate.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ message: 'Error updating invoice' }, { status: 500 })
  }
}

export async function DELETE(
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

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ message: 'Invalid invoice ID' }, { status: 400 })
    }

    const result = await invoiceService.delete(BigInt(id), clinicId, session.user.id)

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 })
    }

    return NextResponse.json({ message: 'Invoice deleted' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ message: 'Error deleting invoice' }, { status: 500 })
  }
}
