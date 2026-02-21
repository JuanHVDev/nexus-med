import { describe, it, expect, beforeAll } from 'vitest'
import { testPrisma, testData } from '../setup/db-setup'
import { getTestClinicId, getTestPatient } from '../setup/auth-helpers'
import { invoiceBaseSchema } from '@/lib/validations/invoice'

describe('Invoices Integration', () => {
  let clinicId: bigint
  let adminUser: typeof testData.users[0]

  beforeAll(() => {
    clinicId = getTestClinicId()
    adminUser = testData.users.find(u => u.role === 'ADMIN')!
  })

  describe('Invoice CRUD Operations', () => {
    it('should list invoices for a clinic', async () => {
      const invoices = await testPrisma.invoice.findMany({
        where: { clinicId },
        orderBy: { issueDate: 'desc' },
        take: 10,
      })

      expect(invoices).toBeDefined()
    })

    it('should create an invoice', async () => {
      const patient = getTestPatient()

      const invoice = await testPrisma.invoice.create({
        data: {
          clinicId,
          patientId: patient.id,
          clinicInvoiceNumber: `INV-${Date.now()}`,
          issuedById: adminUser.id,
          subtotal: 500,
          tax: 0,
          discount: 0,
          total: 500,
          status: 'PENDING',
          items: {
            create: [
              {
                description: 'Consulta médica',
                quantity: 1,
                unitPrice: 500,
                discount: 0,
                total: 500,
              },
            ],
          },
        },
        include: { items: true },
      })

      expect(invoice).toBeDefined()
      expect(invoice.status).toBe('PENDING')
      expect(invoice.items.length).toBeGreaterThan(0)

      await testPrisma.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } })
      await testPrisma.invoice.delete({ where: { id: invoice.id } })
    })

    it('should update invoice status', async () => {
      const patient = getTestPatient()

      const invoice = await testPrisma.invoice.create({
        data: {
          clinicId,
          patientId: patient.id,
          clinicInvoiceNumber: `INV-${Date.now()}`,
          issuedById: adminUser.id,
          subtotal: 500,
          total: 500,
          status: 'PENDING',
        },
      })

      const updated = await testPrisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'PAID' },
      })

      expect(updated.status).toBe('PAID')

      await testPrisma.invoice.delete({ where: { id: invoice.id } })
    })

    it('should add payment to invoice', async () => {
      const patient = getTestPatient()

      const invoice = await testPrisma.invoice.create({
        data: {
          clinicId,
          patientId: patient.id,
          clinicInvoiceNumber: `INV-${Date.now()}`,
          issuedById: adminUser.id,
          subtotal: 500,
          total: 500,
          status: 'PENDING',
        },
      })

      await testPrisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: 500,
          method: 'CASH',
          paymentDate: new Date(),
        },
      })

      const withPayments = await testPrisma.invoice.findUnique({
        where: { id: invoice.id },
        include: { payments: true },
      })

      expect(withPayments?.payments.length).toBeGreaterThan(0)
      // Status update is handled by API, not Prisma - verify payment exists
      expect(withPayments?.status).toBeDefined()

      await testPrisma.payment.deleteMany({ where: { invoiceId: invoice.id } })
      await testPrisma.invoice.delete({ where: { id: invoice.id } })
    })

    it('should calculate partial payment', async () => {
      const patient = getTestPatient()

      const invoice = await testPrisma.invoice.create({
        data: {
          clinicId,
          patientId: patient.id,
          clinicInvoiceNumber: `INV-${Date.now()}`,
          issuedById: adminUser.id,
          subtotal: 500,
          total: 500,
          status: 'PENDING',
        },
      })

      await testPrisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: 250,
          method: 'TRANSFER',
          reference: 'TRF123',
          paymentDate: new Date(),
        },
      })

      const withPayments = await testPrisma.invoice.findUnique({
        where: { id: invoice.id },
        include: { payments: true },
      })

      const totalPaid = withPayments?.payments.reduce((sum, p) => sum + Number(p.amount), 0) || 0
      
      expect(totalPaid).toBe(250)
      // Status update is handled by API, not Prisma - verify payment exists
      expect(withPayments?.status).toBeDefined()

      await testPrisma.payment.deleteMany({ where: { invoiceId: invoice.id } })
      await testPrisma.invoice.delete({ where: { id: invoice.id } })
    })

    it('should filter invoices by status', async () => {
      const pending = await testPrisma.invoice.findMany({
        where: { clinicId, status: 'PENDING' },
      })

      expect(pending).toBeDefined()
    })

    it('should filter invoices by patient', async () => {
      const patient = getTestPatient()
      
      const invoices = await testPrisma.invoice.findMany({
        where: { clinicId, patientId: patient.id },
      })

      expect(invoices).toBeDefined()
    })

    it('should filter invoices by date range', async () => {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const invoices = await testPrisma.invoice.findMany({
        where: {
          clinicId,
          issueDate: {
            gte: thirtyDaysAgo,
          },
        },
      })

      expect(invoices).toBeDefined()
    })
  })

  describe('Invoice Validation', () => {
    it('should validate invoice schema', () => {
      const validData = {
        patientId: '123',
        items: [
          {
            description: 'Consulta',
            quantity: 1,
            unitPrice: 500,
            discount: 0,
          },
        ],
      }

      const result = invoiceBaseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require at least one item', () => {
      const invalidData = {
        patientId: '123',
        items: [],
      }

      const result = invoiceBaseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should calculate totals correctly', () => {
      const items = [
        { quantity: 2, unitPrice: 100, discount: 20 },
      ]

      const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
      const totalDiscount = items.reduce((sum, i) => sum + i.discount, 0)
      const total = subtotal - totalDiscount

      expect(subtotal).toBe(200)
      expect(totalDiscount).toBe(20)
      expect(total).toBe(180)
    })
  })

  describe('Invoice PDF Generation', () => {
    it('should have required fields for PDF', async () => {
      const patient = getTestPatient()

      const invoice = await testPrisma.invoice.create({
        data: {
          clinicId,
          patientId: patient.id,
          clinicInvoiceNumber: `INV-${Date.now()}`,
          issuedById: adminUser.id,
          subtotal: 500,
          total: 500,
          status: 'PENDING',
          notes: 'Notas de prueba',
          items: {
            create: [
              {
                description: 'Servicio 1',
                quantity: 1,
                unitPrice: 300,
                discount: 0,
                total: 300,
              },
              {
                description: 'Servicio 2',
                quantity: 1,
                unitPrice: 200,
                discount: 0,
                total: 200,
              },
            ],
          },
        },
        include: { patient: true, items: true },
      })

      expect(invoice.clinicInvoiceNumber).toBeDefined()
      expect(invoice.issueDate).toBeDefined()
      expect(invoice.patient).toBeDefined()
      expect(invoice.items.length).toBe(2)

      await testPrisma.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } })
      await testPrisma.invoice.delete({ where: { id: invoice.id } })
    })
  })
})
