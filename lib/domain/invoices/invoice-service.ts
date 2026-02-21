import type { 
  InvoiceFilter, 
  InvoiceWithRelations, 
  InvoiceStatus,
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  CreatePaymentDTO,
  PaymentWithInvoice
} from "./types"
import { invoiceRepository } from "./invoice-repository"
import { 
  calculateInvoiceTotals, 
  calculateTotalPaid, 
  determinePaymentStatus, 
  canDeleteInvoice, 
  canAddPayment,
  generateInvoiceNumber 
} from "./invoice-calculator"
import { logAudit } from "@/lib/audit"

export class InvoiceService {
  async create(
    data: CreateInvoiceDTO,
    clinicId: bigint,
    userId: string
  ): Promise<{ success: true; invoice: InvoiceWithRelations } | { success: false; error: string }> {
    const itemsWithTotals = data.items.map(item => ({
      ...item,
      total: (item.quantity * item.unitPrice) - item.discount,
    }))

    const totals = calculateInvoiceTotals(itemsWithTotals)

    const lastNumber = await invoiceRepository.findLastInvoiceNumber(clinicId)
    const invoiceNumber = generateInvoiceNumber(lastNumber)

    const invoice = await invoiceRepository.create({
      ...data,
      clinicId,
      issuedById: userId,
      invoiceNumber,
      totals,
      items: itemsWithTotals,
    })

    await logAudit(userId, {
      action: "CREATE",
      entityType: "Invoice",
      entityId: invoice.id.toString(),
      entityName: `Factura #${invoice.clinicInvoiceNumber}`,
    })

    return { success: true, invoice }
  }

  async getById(
    id: bigint,
    clinicId: bigint,
    userId: string
  ): Promise<InvoiceWithRelations | null> {
    const invoice = await invoiceRepository.findById(id, clinicId)
    
    if (invoice) {
      await logAudit(userId, {
        action: "READ",
        entityType: "Invoice",
        entityId: id.toString(),
        entityName: `Factura #${invoice.clinicInvoiceNumber}`,
      })
    }

    return invoice
  }

  async getMany(
    filter: InvoiceFilter,
    page: number = 1,
    limit: number = 10
  ): Promise<{ 
    invoices: InvoiceWithRelations[]
    total: number
    pages: number
    summary: {
      totalInvoices: number
      totalAmount: number
      totalPaid: number
      totalPending: number
    }
  }> {
    const { invoices, total } = await invoiceRepository.findMany(filter, page, limit)

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0)
    const totalPaid = invoices.reduce((sum, inv) => {
      return sum + calculateTotalPaid(inv.payments)
    }, 0)

    return {
      invoices,
      total,
      pages: Math.ceil(total / limit),
      summary: {
        totalInvoices: total,
        totalAmount,
        totalPaid,
        totalPending: totalAmount - totalPaid,
      }
    }
  }

  async update(
    id: bigint,
    clinicId: bigint,
    data: UpdateInvoiceDTO,
    userId: string
  ): Promise<{ success: true; invoice: InvoiceWithRelations } | { success: false; error: string }> {
    const existing = await invoiceRepository.findById(id, clinicId)
    
    if (!existing) {
      return { success: false, error: "Factura no encontrada" }
    }

    const invoice = await invoiceRepository.update(id, data)

    await logAudit(userId, {
      action: "UPDATE",
      entityType: "Invoice",
      entityId: id.toString(),
      entityName: `Factura #${invoice.clinicInvoiceNumber}`,
    })

    return { success: true, invoice }
  }

  async delete(
    id: bigint,
    clinicId: bigint,
    userId: string
  ): Promise<{ success: true } | { success: false; error: string }> {
    const existing = await invoiceRepository.findById(id, clinicId)
    
    if (!existing) {
      return { success: false, error: "Factura no encontrada" }
    }

    const hasPayments = await invoiceRepository.hasPayments(id)
    const deleteCheck = canDeleteInvoice(existing.status, hasPayments)

    if (!deleteCheck.canDelete) {
      return { success: false, error: deleteCheck.reason! }
    }

    await invoiceRepository.delete(id)

    await logAudit(userId, {
      action: "DELETE",
      entityType: "Invoice",
      entityId: id.toString(),
      entityName: `Factura #${existing.clinicInvoiceNumber}`,
    })

    return { success: true }
  }

  async addPayment(
    invoiceId: bigint,
    clinicId: bigint,
    data: CreatePaymentDTO,
    userId: string
  ): Promise<{ success: true; payment: PaymentWithInvoice } | { success: false; error: string }> {
    const invoice = await invoiceRepository.findById(invoiceId, clinicId)
    
    if (!invoice) {
      return { success: false, error: "Factura no encontrada" }
    }

    const paymentCheck = canAddPayment(invoice.status)
    if (!paymentCheck.canAdd) {
      return { success: false, error: paymentCheck.reason! }
    }

    const totalPaid = calculateTotalPaid(invoice.payments)
    const newTotalPaid = totalPaid + data.amount
    const newStatus = determinePaymentStatus(invoice.total, newTotalPaid)

    const payment = await invoiceRepository.addPayment(invoiceId, data)
    
    if (newStatus !== invoice.status) {
      await invoiceRepository.updateStatus(invoiceId, newStatus as InvoiceStatus)
    }

    await logAudit(userId, {
      action: "UPDATE",
      entityType: "Invoice",
      entityId: invoiceId.toString(),
      entityName: `Pago registrado en Factura #${invoice.clinicInvoiceNumber}`,
    })

    return { success: true, payment }
  }

  calculateTotals(invoice: InvoiceWithRelations): {
    totalPaid: number
    balance: number
  } {
    const totalPaid = calculateTotalPaid(invoice.payments)
    const balance = invoice.total - totalPaid
    return { totalPaid, balance }
  }
}

export const invoiceService = new InvoiceService()
