import { z } from "zod"

export const invoiceItemSchema = z.object({
  serviceId: z.string().optional(),
  description: z.string().min(1, "Descripción requerida"),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0),
})

export const invoiceBaseSchema = z.object({
  patientId: z.string().min(1, "Paciente requerido"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Al menos un item requerido"),
})

export const invoiceInputSchema = z.object({
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Al menos un item requerido"),
})

export const invoiceSchema = invoiceBaseSchema.transform((data) => {
  const itemsWithTotals = data.items.map(item => ({
    ...item,
    serviceId: item.serviceId ? BigInt(item.serviceId) : undefined,
    total: (item.quantity * item.unitPrice) - item.discount,
  }))
  
  return {
    ...data,
    patientId: BigInt(data.patientId),
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    items: itemsWithTotals,
  }
})

export const invoiceUpdateSchema = z.object({
  status: z.enum(["PENDING", "PAID", "PARTIAL", "CANCELLED"]).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})

export const invoiceFilterSchema = z.object({
  patientId: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "PARTIAL", "CANCELLED"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const paymentSchema = z.object({
  amount: z.number().min(0.01, "Monto requerido"),
  method: z.enum(["CASH", "CARD", "TRANSFER", "CHECK"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export type InvoiceItem = z.infer<typeof invoiceItemSchema>
export type InvoiceFormData = z.infer<typeof invoiceSchema>
export type InvoiceInputFormData = z.infer<typeof invoiceInputSchema>
export type InvoiceFilterData = z.infer<typeof invoiceFilterSchema>
export type PaymentFormData = z.infer<typeof paymentSchema>
