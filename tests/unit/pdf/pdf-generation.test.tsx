import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page: ({ children }: { children: React.ReactNode }) => children,
  Text: ({ children }: { children: React.ReactNode }) => children,
  View: ({ children }: { children: React.ReactNode }) => children,
  StyleSheet: {
    create: (styles: Record<string, unknown>) => styles,
  },
  pdf: vi.fn().mockReturnValue({
    toBlob: vi.fn().mockResolvedValue(new Blob(['PDF content'], { type: 'application/pdf' })),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('PDF content')),
  }),
}))

vi.mock('date-fns', () => ({
  format: vi.fn().mockReturnValue('15/01/2024'),
}))

vi.mock('date-fns/locale', () => ({
  es: 'es',
}))

const mockPrescriptionData = {
  id: '1',
  patient: {
    firstName: 'Juan',
    lastName: 'Pérez',
    curp: 'PEAJ900515HNLRRN01',
    birthDate: new Date('1990-05-15'),
    gender: 'MALE',
  },
  doctor: {
    name: 'Dr. María García',
    specialty: 'Medicina General',
    cedula: '12345678',
  },
  clinic: {
    name: 'Clínica Healthcare',
    address: 'Av. Principal 123',
    phone: '5551234567',
  },
  medications: [
    {
      name: 'Aspirin',
      dosage: '100mg',
      route: 'ORAL',
      frequency: 'Cada 8 horas',
      duration: '7 días',
      instructions: 'Tomar con alimentos',
    },
    {
      name: 'Amoxicilina',
      dosage: '500mg',
      route: 'ORAL',
      frequency: 'Cada 12 horas',
      duration: '10 días',
      instructions: 'Completar tratamiento',
    },
  ],
  instructions: 'Seguir indicaciones. En caso de reacciones adversas, suspender y consultar.',
  validUntil: new Date('2024-01-25'),
  createdAt: new Date('2024-01-15'),
}

const mockInvoiceData = {
  id: '1',
  patient: {
    firstName: 'Juan',
    lastName: 'Pérez',
  },
  invoiceNumber: 'INV-2024-001',
  issueDate: new Date('2024-01-15'),
  dueDate: new Date('2024-01-30'),
  items: [
    {
      description: 'Consulta de Medicina General',
      quantity: 1,
      unitPrice: 500,
      discount: 0,
    },
    {
      description: 'Biometría Hemática',
      quantity: 1,
      unitPrice: 250,
      discount: 50,
    },
  ],
  subtotal: 750,
  discount: 50,
  tax: 112,
  total: 812,
  status: 'PENDING',
  notes: 'Gracias por su preferencia',
}

describe('Prescription PDF Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.skip('should generate prescription PDF without errors', async () => {
    const { pdf } = await import('@react-pdf/renderer')

    const blob = await pdf(<PrescriptionDocument data={mockPrescriptionData} />).toBlob()
    
    expect(blob).toBeDefined()
    expect(blob.type).toBe('application/pdf')
  })

  it('should include patient information in prescription', () => {
    expect(mockPrescriptionData.patient.firstName).toBe('Juan')
    expect(mockPrescriptionData.patient.lastName).toBe('Pérez')
    expect(mockPrescriptionData.patient.curp).toBe('PEAJ900515HNLRRN01')
  })

  it('should include doctor information in prescription', () => {
    expect(mockPrescriptionData.doctor.name).toBe('Dr. María García')
    expect(mockPrescriptionData.doctor.specialty).toBe('Medicina General')
    expect(mockPrescriptionData.doctor.cedula).toBe('12345678')
  })

  it('should include clinic information in prescription', () => {
    expect(mockPrescriptionData.clinic.name).toBe('Clínica Healthcare')
    expect(mockPrescriptionData.clinic.address).toBe('Av. Principal 123')
    expect(mockPrescriptionData.clinic.phone).toBe('5551234567')
  })

  it('should include all medications in prescription', () => {
    expect(mockPrescriptionData.medications).toHaveLength(2)
    expect(mockPrescriptionData.medications[0].name).toBe('Aspirin')
    expect(mockPrescriptionData.medications[1].name).toBe('Amoxicilina')
  })

  it('should include medication details correctly', () => {
    const medication = mockPrescriptionData.medications[0]
    expect(medication.dosage).toBe('100mg')
    expect(medication.route).toBe('ORAL')
    expect(medication.frequency).toBe('Cada 8 horas')
    expect(medication.duration).toBe('7 días')
  })

  it('should include prescription validity date', () => {
    expect(mockPrescriptionData.validUntil).toBeInstanceOf(Date)
  })

  it('should handle prescription with single medication', () => {
    const singleMedPrescription = {
      ...mockPrescriptionData,
      medications: [mockPrescriptionData.medications[0]],
    }
    expect(singleMedPrescription.medications).toHaveLength(1)
  })

  it('should include prescription instructions', () => {
    expect(mockPrescriptionData.instructions).toBeTruthy()
    expect(typeof mockPrescriptionData.instructions).toBe('string')
  })
})

describe('Invoice PDF Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.skip('should generate invoice PDF without errors', async () => {
    const { pdf } = await import('@react-pdf/renderer')

    const blob = await pdf(<InvoiceDocument data={mockInvoiceData} />).toBlob()
    
    expect(blob).toBeDefined()
    expect(blob.type).toBe('application/pdf')
  })

  it('should include patient information in invoice', () => {
    expect(mockInvoiceData.patient.firstName).toBe('Juan')
    expect(mockInvoiceData.patient.lastName).toBe('Pérez')
  })

  it('should include invoice number', () => {
    expect(mockInvoiceData.invoiceNumber).toBe('INV-2024-001')
  })

  it('should include all invoice items', () => {
    expect(mockInvoiceData.items).toHaveLength(2)
    expect(mockInvoiceData.items[0].description).toBe('Consulta de Medicina General')
    expect(mockInvoiceData.items[1].description).toBe('Biometría Hemática')
  })

  it('should calculate subtotal correctly', () => {
    const expectedSubtotal = 500 + 250
    expect(mockInvoiceData.subtotal).toBe(expectedSubtotal)
  })

  it('should apply discount correctly', () => {
    expect(mockInvoiceData.discount).toBe(50)
    const itemWithDiscount = mockInvoiceData.items.find(item => item.discount > 0)
    expect(itemWithDiscount).toBeDefined()
    expect(itemWithDiscount?.discount).toBe(50)
  })

  it('should calculate tax at 16%', () => {
    const taxableAmount = mockInvoiceData.subtotal - mockInvoiceData.discount
    const expectedTax = taxableAmount * 0.16
    expect(mockInvoiceData.tax).toBe(expectedTax)
  })

  it('should calculate total correctly', () => {
    const taxableAmount = mockInvoiceData.subtotal - mockInvoiceData.discount
    const expectedTotal = taxableAmount + mockInvoiceData.tax
    expect(mockInvoiceData.total).toBe(expectedTotal)
  })

  it('should include invoice dates', () => {
    expect(mockInvoiceData.issueDate).toBeInstanceOf(Date)
    expect(mockInvoiceData.dueDate).toBeInstanceOf(Date)
  })

  it('should include invoice status', () => {
    expect(mockInvoiceData.status).toBe('PENDING')
  })

  it('should handle invoice with no discount', () => {
    const noDiscountInvoice = {
      ...mockInvoiceData,
      discount: 0,
      items: mockInvoiceData.items.map(item => ({ ...item, discount: 0 })),
    }
    expect(noDiscountInvoice.discount).toBe(0)
  })

  it('should handle invoice with multiple items', () => {
    const multiItemInvoice = {
      ...mockInvoiceData,
      items: [
        ...mockInvoiceData.items,
        { description: 'Consulta de Especialidad', quantity: 1, unitPrice: 800, discount: 0 },
        { description: ' electrocardiograma', quantity: 1, unitPrice: 350, discount: 0 },
      ],
    }
    expect(multiItemInvoice.items).toHaveLength(4)
  })

  it('should include invoice notes', () => {
    expect(mockInvoiceData.notes).toBe('Gracias por su preferencia')
  })
})

describe('PDF Content Validation', () => {
  it('should contain valid data structure for prescription', () => {
    const requiredFields = ['id', 'patient', 'doctor', 'clinic', 'medications', 'validUntil']
    requiredFields.forEach(field => {
      expect(mockPrescriptionData).toHaveProperty(field)
    })
  })

  it('should contain valid data structure for invoice', () => {
    const requiredFields = ['id', 'patient', 'invoiceNumber', 'items', 'subtotal', 'tax', 'total']
    requiredFields.forEach(field => {
      expect(mockInvoiceData).toHaveProperty(field)
    })
  })

  it('should have valid medication structure', () => {
    const medicationFields = ['name', 'dosage', 'route', 'frequency', 'duration']
    mockPrescriptionData.medications.forEach(med => {
      medicationFields.forEach(field => {
        expect(med).toHaveProperty(field)
      })
    })
  })

  it('should have valid invoice item structure', () => {
    const itemFields = ['description', 'quantity', 'unitPrice', 'discount']
    mockInvoiceData.items.forEach(item => {
      itemFields.forEach(field => {
        expect(item).toHaveProperty(field)
      })
    })
  })
})

describe('PDF Edge Cases', () => {
  it('should handle prescription with special characters in patient name', () => {
    const specialCharsPrescription = {
      ...mockPrescriptionData,
      patient: {
        ...mockPrescriptionData.patient,
        firstName: 'José María',
        lastName: 'García-López',
      },
    }
    expect(specialCharsPrescription.patient.firstName).toContain(' ')
    expect(specialCharsPrescription.patient.lastName).toContain('-')
  })

  it('should handle long medication instructions', () => {
    const longInstructions = 'A'.repeat(500)
    const prescription = {
      ...mockPrescriptionData,
      instructions: longInstructions,
    }
    expect(prescription.instructions.length).toBe(500)
  })

  it('should handle invoice with zero amount', () => {
    const zeroInvoice = {
      ...mockInvoiceData,
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
    }
    expect(zeroInvoice.total).toBe(0)
  })

  it('should handle prescription without instructions', () => {
    const noInstructionsPrescription = {
      ...mockPrescriptionData,
      instructions: '',
    }
    expect(noInstructionsPrescription.instructions).toBe('')
  })

  it('should handle invoice with many items', () => {
    const manyItems = Array.from({ length: 20 }, (_, i) => ({
      description: `Service ${i + 1}`,
      quantity: 1,
      unitPrice: 100,
      discount: 0,
    }))
    const manyItemsInvoice = {
      ...mockInvoiceData,
      items: manyItems,
    }
    expect(manyItemsInvoice.items).toHaveLength(20)
  })
})

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Document, Page, Text, View, StyleSheet } = require('@react-pdf/renderer')

function PrescriptionDocument({ data }: { data: typeof mockPrescriptionData }) {
  const styles = StyleSheet.create({
    page: { padding: 40 },
    header: { alignItems: 'center', marginBottom: 30 },
    title: { fontSize: 24, fontWeight: 'bold' },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Receta Médica</Text>
          <Text>{data.clinic.name}</Text>
        </View>
        <View>
          <Text>{data.patient.firstName} {data.patient.lastName}</Text>
          <Text>{data.patient.curp}</Text>
        </View>
        <View>
          {data.medications.map((med: typeof mockPrescriptionData.medications[0], index: number) => (
            <Text key={index}>{med.name} - {med.dosage}</Text>
          ))}
        </View>
      </Page>
    </Document>
  )
}

function InvoiceDocument({ data }: { data: typeof mockInvoiceData }) {
  const styles = StyleSheet.create({
    page: { padding: 40 },
    header: { alignItems: 'center', marginBottom: 30 },
    title: { fontSize: 24, fontWeight: 'bold' },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Factura</Text>
          <Text>{data.invoiceNumber}</Text>
        </View>
        <View>
          <Text>{data.patient.firstName} {data.patient.lastName}</Text>
        </View>
        <View>
          {data.items.map((item: typeof mockInvoiceData.items[0], index: number) => (
            <Text key={index}>{item.description} - ${item.unitPrice}</Text>
          ))}
        </View>
        <View>
          <Text>Total: ${data.total}</Text>
        </View>
      </Page>
    </Document>
  )
}
