import type { InvoiceTotals, InvoiceItemDTO } from "./types"

export function calculateItemTotal(item: Omit<InvoiceItemDTO, 'total'>): number {
  return (item.quantity * item.unitPrice) - item.discount
}

export function calculateInvoiceTotals(items: InvoiceItemDTO[]): InvoiceTotals {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0)
  const tax = 0
  const total = subtotal - totalDiscount + tax

  return {
    subtotal,
    totalDiscount,
    tax,
    total,
  }
}

export function calculateTotalPaid(payments: Array<{ amount: number }>): number {
  return payments.reduce((sum, pay) => sum + pay.amount, 0)
}

export function calculateBalance(total: number, totalPaid: number): number {
  return total - totalPaid
}

export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID"

export function determinePaymentStatus(total: number, totalPaid: number): PaymentStatus {
  if (totalPaid >= total) {
    return "PAID"
  }
  if (totalPaid > 0) {
    return "PARTIAL"
  }
  return "PENDING"
}

export function canDeleteInvoice(
  status: string,
  hasPayments: boolean
): { canDelete: boolean; reason?: string } {
  if (hasPayments) {
    return { canDelete: false, reason: "No se puede eliminar una factura con pagos registrados" }
  }
  if (status === "PAID") {
    return { canDelete: false, reason: "No se puede eliminar una factura pagada" }
  }
  return { canDelete: true }
}

export function canAddPayment(status: string): { canAdd: boolean; reason?: string } {
  if (status === "CANCELLED") {
    return { canAdd: false, reason: "No se puede pagar una factura cancelada" }
  }
  return { canAdd: true }
}

export function generateInvoiceNumber(lastNumber: string | null): string {
  if (!lastNumber) {
    return "INV-000001"
  }
  const lastNum = parseInt(lastNumber.split("-")[1] || "0", 10)
  const nextNum = lastNum + 1
  return `INV-${String(nextNum).padStart(6, "0")}`
}
