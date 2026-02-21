export type InvoiceStatus = "PENDING" | "PARTIAL" | "PAID" | "CANCELLED"
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "CHECK"

export interface InvoiceItemDTO {
  serviceId?: bigint
  description: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

export interface CreateInvoiceDTO {
  patientId: bigint
  dueDate?: Date
  notes?: string
  items: InvoiceItemDTO[]
}

export interface UpdateInvoiceDTO {
  status?: InvoiceStatus
  dueDate?: Date
  notes?: string
}

export interface CreatePaymentDTO {
  amount: number
  method: PaymentMethod
  reference?: string
  notes?: string
}

export interface InvoiceFilter {
  clinicId: bigint
  patientId?: bigint
  status?: InvoiceStatus
  startDate?: Date
  endDate?: Date
}

export interface InvoiceWithRelations {
  id: bigint
  clinicId: bigint
  patientId: bigint
  clinicInvoiceNumber: string
  issuedById: string
  issueDate: Date
  dueDate: Date | null
  subtotal: number
  tax: number
  discount: number
  total: number
  status: InvoiceStatus
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
    unitPrice: number
    discount: number
    total: number
  }>
  payments: Array<{
    id: bigint
    invoiceId: bigint
    amount: number
    method: PaymentMethod
    reference: string | null
    notes: string | null
    paymentDate: Date
  }>
}

export interface PaymentWithInvoice {
  id: bigint
  invoiceId: bigint
  amount: number
  method: PaymentMethod
  reference: string | null
  notes: string | null
  paymentDate: Date
}

export interface InvoiceTotals {
  subtotal: number
  totalDiscount: number
  tax: number
  total: number
}

export interface InvoiceRepository {
  findById(id: bigint, clinicId: bigint): Promise<InvoiceWithRelations | null>
  findMany(filter: InvoiceFilter, page: number, limit: number): Promise<{ invoices: InvoiceWithRelations[]; total: number }>
  findLastInvoiceNumber(clinicId: bigint): Promise<string | null>
  create(data: CreateInvoiceDTO & { clinicId: bigint; issuedById: string; invoiceNumber: string; totals: InvoiceTotals }): Promise<InvoiceWithRelations>
  update(id: bigint, data: UpdateInvoiceDTO): Promise<InvoiceWithRelations>
  updateStatus(id: bigint, status: InvoiceStatus): Promise<void>
  delete(id: bigint): Promise<void>
  hasPayments(id: bigint): Promise<boolean>
  addPayment(invoiceId: bigint, data: CreatePaymentDTO): Promise<PaymentWithInvoice>
  getTotalPaid(invoiceId: bigint): Promise<number>
}

export interface InvoiceNumberGenerator {
  generateNext(clinicId: bigint, lastNumber: string | null): string
}

export const ALLOWED_ROLES_FOR_INVOICE = ["ADMIN", "RECEPTIONIST"] as const
export const ALLOWED_ROLES_FOR_PAYMENT = ["ADMIN", "RECEPTIONIST"] as const
