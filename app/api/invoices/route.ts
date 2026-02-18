import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { invoiceInputSchema } from '@/lib/validations/invoice'

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {
      clinicId: BigInt(session.user.clinicId),
    }

    if (patientId) {
      where.patientId = BigInt(patientId)
    }

    if (status) {
      where.status = status
    }

    if (startDate || endDate) {
      where.issueDate = {}
      if (startDate) (where.issueDate as Record<string, Date>).gte = new Date(startDate)
      if (endDate) (where.issueDate as Record<string, Date>).lte = new Date(endDate)
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              middleName: true,
              curp: true,
            }
          },
          issuedBy: {
            select: {
              id: true,
              name: true,
            }
          },
          items: true,
          payments: {
            select: {
              id: true,
              invoiceId: true,
              amount: true,
              method: true,
              paymentDate: true,
            }
          }
        },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    const totalPaid = invoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((pSum, pay) => pSum + Number(pay.amount), 0)
      return sum + paid
    }, 0)

    const totalPending = invoices.reduce((sum, inv) => sum + Number(inv.total), 0) - totalPaid

    return NextResponse.json({
      data: invoices.map(inv => ({
        ...inv,
        id: inv.id.toString(),
        clinicId: inv.clinicId.toString(),
        patientId: inv.patientId.toString(),
        issuedById: inv.issuedById,
        issueDate: inv.issueDate.toISOString(),
        dueDate: inv.dueDate?.toISOString() ?? null,
        subtotal: Number(inv.subtotal),
        tax: Number(inv.tax),
        discount: Number(inv.discount),
        total: Number(inv.total),
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
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
          total: Number(item.total),
        })),
        payments: inv.payments.map(pay => ({
          id: pay.id.toString(),
          invoiceId: pay.invoiceId.toString(),
          amount: Number(pay.amount),
          method: pay.method,
          paymentDate: pay.paymentDate.toISOString(),
        })),
        totalPaid: inv.payments.reduce((sum, pay) => sum + Number(pay.amount), 0),
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalInvoices: total,
        totalAmount: invoices.reduce((sum, inv) => sum + Number(inv.total), 0),
        totalPaid,
        totalPending,
      }
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
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = invoiceInputSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { patientId, dueDate, notes, items } = validation.data

    const patient = await prisma.patient.findFirst({
      where: { id: BigInt(patientId), clinicId: BigInt(session.user.clinicId), deletedAt: null },
    })

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 })
    }

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0)
    const tax = 0 
    const total = subtotal - totalDiscount + tax

    const lastInvoice = await prisma.invoice.findFirst({
      where: { clinicId: BigInt(session.user.clinicId) },
      orderBy: { createdAt: 'desc' },
    })

    const nextNumber = lastInvoice 
      ? parseInt(lastInvoice.clinicInvoiceNumber.split('-')[1] || '0') + 1 
      : 1
    const invoiceNumber = `INV-${String(nextNumber).padStart(6, '0')}`

    const invoice = await prisma.invoice.create({
      data: {
        clinicId: BigInt(session.user.clinicId),
        patientId: BigInt(patientId),
        clinicInvoiceNumber: invoiceNumber,
        issuedById: session.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal,
        tax,
        discount: totalDiscount,
        total,
        status: 'PENDING',
        notes,
        items: {
          create: items.map(item => ({
            serviceId: item.serviceId ? BigInt(item.serviceId) : null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: (item.quantity * item.unitPrice) - item.discount,
          }))
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            curp: true,
          }
        },
        issuedBy: {
          select: {
            id: true,
            name: true,
          }
        },
        items: true,
      },
    })

    return NextResponse.json({
      ...invoice,
      id: invoice.id.toString(),
      clinicId: invoice.clinicId.toString(),
      patientId: invoice.patientId.toString(),
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString() ?? null,
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      discount: Number(invoice.discount),
      total: Number(invoice.total),
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
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        total: Number(item.total),
      })),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ message: 'Error creating invoice' }, { status: 500 })
  }
}
