import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { invoiceUpdateSchema } from '@/lib/validations/invoice'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ message: 'Invalid invoice ID' }, { status: 400 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: BigInt(id),
        clinicId: BigInt(session.user.clinicId),
      },
      include: {
        patient: true,
        issuedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 })
    }

    const totalPaid = invoice.payments.reduce((sum, pay) => sum + Number(pay.amount), 0)

    const serializedInvoice = {
      id: invoice.id.toString(),
      clinicId: invoice.clinicId.toString(),
      patientId: invoice.patientId.toString(),
      clinicInvoiceNumber: invoice.clinicInvoiceNumber,
      issuedById: invoice.issuedById,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString() ?? null,
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      discount: Number(invoice.discount),
      total: Number(invoice.total),
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
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        total: Number(item.total),
      })),
      payments: invoice.payments.map(pay => ({
        id: pay.id.toString(),
        invoiceId: pay.invoiceId.toString(),
        amount: Number(pay.amount),
        method: pay.method,
        reference: pay.reference,
        notes: pay.notes,
        paymentDate: pay.paymentDate.toISOString(),
      })),
      totalPaid,
      balance: Number(invoice.total) - totalPaid,
    }

    return NextResponse.json(serializedInvoice)
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
    
    if (!session?.user?.clinicId) {
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

    const existing = await prisma.invoice.findFirst({
      where: {
        id: BigInt(id),
        clinicId: BigInt(session.user.clinicId),
      },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 })
    }

    const { status, dueDate, notes } = validation.data

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (dueDate) updateData.dueDate = new Date(dueDate)
    if (notes !== undefined) updateData.notes = notes

    const invoice = await prisma.invoice.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
          }
        },
        issuedBy: {
          select: {
            id: true,
            name: true,
          }
        },
        items: true,
        payments: true,
      },
    })

    return NextResponse.json({
      id: invoice.id.toString(),
      clinicId: invoice.clinicId.toString(),
      patientId: invoice.patientId.toString(),
      clinicInvoiceNumber: invoice.clinicInvoiceNumber,
      issuedById: invoice.issuedById,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString() ?? null,
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      discount: Number(invoice.discount),
      total: Number(invoice.total),
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
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        total: Number(item.total),
      })),
      payments: invoice.payments.map(pay => ({
        id: pay.id.toString(),
        invoiceId: pay.invoiceId.toString(),
        amount: Number(pay.amount),
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
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ message: 'Invalid invoice ID' }, { status: 400 })
    }

    const existing = await prisma.invoice.findFirst({
      where: {
        id: BigInt(id),
        clinicId: BigInt(session.user.clinicId),
      },
      include: {
        payments: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 })
    }

    if (existing.payments.length > 0) {
      return NextResponse.json(
        { message: 'No se puede eliminar una factura con pagos registrados' },
        { status: 400 }
      )
    }

    if (existing.status === 'PAID') {
      return NextResponse.json(
        { message: 'No se puede eliminar una factura pagada' },
        { status: 400 }
      )
    }

    await prisma.invoice.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({ message: 'Invoice deleted' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ message: 'Error deleting invoice' }, { status: 500 })
  }
}
