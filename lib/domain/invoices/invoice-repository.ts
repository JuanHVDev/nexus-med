import { prisma } from "@/lib/prisma"
import type { 
  InvoiceWithRelations, 
  InvoiceRepository,
  InvoiceStatus,
  PaymentMethod
} from "./types"

type PrismaMoney = unknown

type PrismaInvoice = {
  id: bigint
  clinicId: bigint
  patientId: bigint
  clinicInvoiceNumber: string
  issuedById: string
  issueDate: Date
  dueDate: Date | null
  subtotal: PrismaMoney
  tax: PrismaMoney
  discount: PrismaMoney
  total: PrismaMoney
  status: string
  notes: string | null
  patient: {
    id: bigint
    firstName: string
    lastName: string
    middleName: string | null
    curp: string | null
  }
  issuedBy: {
    id: string
    name: string
    email: string
  }
  items: Array<{
    id: bigint
    invoiceId: bigint
    serviceId: bigint | null
    description: string
    quantity: number
    unitPrice: PrismaMoney
    discount: PrismaMoney
    total: PrismaMoney
  }>
  payments: Array<{
    id: bigint
    invoiceId: bigint
    amount: PrismaMoney
    method: string
    reference: string | null
    notes: string | null
    paymentDate: Date
  }>
}

function mapInvoiceToResponse(inv: PrismaInvoice): InvoiceWithRelations {
  return {
    id: inv.id,
    clinicId: inv.clinicId,
    patientId: inv.patientId,
    clinicInvoiceNumber: inv.clinicInvoiceNumber,
    issuedById: inv.issuedById,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    subtotal: Number(inv.subtotal),
    tax: Number(inv.tax),
    discount: Number(inv.discount),
    total: Number(inv.total),
    status: inv.status as InvoiceStatus,
    notes: inv.notes,
    patient: inv.patient,
    issuedBy: inv.issuedBy,
    items: inv.items.map(item => ({
      id: item.id,
      invoiceId: item.invoiceId,
      serviceId: item.serviceId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      total: Number(item.total),
    })),
    payments: inv.payments.map(pay => ({
      id: pay.id,
      invoiceId: pay.invoiceId,
      amount: Number(pay.amount),
      method: pay.method as PaymentMethod,
      reference: pay.reference,
      notes: pay.notes,
      paymentDate: pay.paymentDate,
    })),
  }
}

export const invoiceRepository: InvoiceRepository = {
  async findById(id, clinicId) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, clinicId },
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
            email: true,
          }
        },
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    })

    if (!invoice) return null
    return mapInvoiceToResponse(invoice)
  },

  async findMany(filter, page, limit) {
    const where: Record<string, unknown> = {
      clinicId: filter.clinicId,
    }

    if (filter.patientId) where.patientId = filter.patientId
    if (filter.status) where.status = filter.status
    if (filter.startDate || filter.endDate) {
      where.issueDate = {}
      if (filter.startDate) (where.issueDate as Record<string, Date>).gte = filter.startDate
      if (filter.endDate) (where.issueDate as Record<string, Date>).lte = filter.endDate
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
              email: true,
            }
          },
          items: true,
          payments: {
            select: {
              id: true,
              invoiceId: true,
              amount: true,
              method: true,
              reference: true,
              notes: true,
              paymentDate: true,
            }
          },
        },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return {
      invoices: invoices.map(mapInvoiceToResponse),
      total,
    }
  },

  async findLastInvoiceNumber(clinicId) {
    const lastInvoice = await prisma.invoice.findFirst({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
      select: { clinicInvoiceNumber: true },
    })
    return lastInvoice?.clinicInvoiceNumber ?? null
  },

  async create(data) {
    const invoice = await prisma.invoice.create({
      data: {
        clinicId: data.clinicId,
        patientId: data.patientId,
        clinicInvoiceNumber: data.invoiceNumber,
        issuedById: data.issuedById,
        dueDate: data.dueDate ?? null,
        subtotal: data.totals.subtotal,
        tax: data.totals.tax,
        discount: data.totals.totalDiscount,
        total: data.totals.total,
        status: "PENDING",
        notes: data.notes,
        items: {
          create: data.items.map(item => ({
            serviceId: item.serviceId ?? null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
          })),
        },
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
            email: true,
          }
        },
        items: true,
        payments: true,
      },
    })

    return mapInvoiceToResponse(invoice)
  },

  async update(id, data) {
    const updateData: Record<string, unknown> = {}
    if (data.status) updateData.status = data.status
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate)
    if (data.notes !== undefined) updateData.notes = data.notes

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
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
            email: true,
          }
        },
        items: true,
        payments: true,
      },
    })

    return mapInvoiceToResponse(invoice)
  },

  async updateStatus(id, status) {
    await prisma.invoice.update({
      where: { id },
      data: { status },
    })
  },

  async delete(id) {
    await prisma.invoice.delete({
      where: { id },
    })
  },

  async hasPayments(id) {
    const count = await prisma.payment.count({
      where: { invoiceId: id },
    })
    return count > 0
  },

  async addPayment(invoiceId, data) {
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: data.amount,
        method: data.method,
        reference: data.reference ?? null,
        notes: data.notes ?? null,
        paymentDate: new Date(),
      },
    })

    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      amount: Number(payment.amount),
      method: payment.method as PaymentMethod,
      reference: payment.reference,
      notes: payment.notes,
      paymentDate: payment.paymentDate,
    }
  },

  async getTotalPaid(invoiceId) {
    const payments = await prisma.payment.findMany({
      where: { invoiceId },
      select: { amount: true },
    })
    return payments.reduce((sum, pay) => sum + Number(pay.amount), 0)
  },
}
