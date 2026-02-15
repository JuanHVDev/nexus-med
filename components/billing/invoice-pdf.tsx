'use client'

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  invoiceInfo: {
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  date: {
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#666',
  },
  value: {
    fontWeight: 'normal',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  colDescription: {
    width: '50%',
  },
  colQty: {
    width: '15%',
    textAlign: 'center',
  },
  colPrice: {
    width: '17.5%',
    textAlign: 'right',
  },
  colTotal: {
    width: '17.5%',
    textAlign: 'right',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#333',
  },
  totals: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 4,
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#999',
    fontSize: 8,
  },
  status: {
    padding: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
})

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

interface Patient {
  firstName: string
  lastName: string
  middleName: string | null
  curp: string | null
}

interface Invoice {
  id: string
  clinicInvoiceNumber: string
  issueDate: string
  dueDate: string | null
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
  notes: string | null
  patient: Patient
  issuedBy: { name: string }
  items: InvoiceItem[]
  payments: Array<{
    amount: number
    method: string
    paymentDate: string
  }>
}

interface InvoicePDFProps {
  invoice: Invoice
  clinicName?: string
}

export function InvoicePDF({ invoice, clinicName = 'HC GESTOR' }: InvoicePDFProps) {
  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy', { locale: es })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return '#22c55e'
      case 'PENDING': return '#f59e0b'
      case 'PARTIAL': return '#3b82f6'
      case 'CANCELLED': return '#ef4444'
      default: return '#666'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'PAGADO'
      case 'PENDING': return 'PENDIENTE'
      case 'PARTIAL': return 'PARCIAL'
      case 'CANCELLED': return 'CANCELADO'
      default: return status
    }
  }

  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
  const pending = invoice.total - totalPaid

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{clinicName}</Text>
            <Text style={{ color: '#666', marginTop: 4 }}>Factura Médica</Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceNumber}>{invoice.clinicInvoiceNumber}</Text>
            <Text style={styles.date}>Fecha: {formatDate(invoice.issueDate)}</Text>
            {invoice.dueDate && (
              <Text style={styles.date}>Vencimiento: {formatDate(invoice.dueDate)}</Text>
            )}
            <View style={[styles.status, { backgroundColor: getStatusColor(invoice.status), color: 'white', marginTop: 8, alignSelf: 'flex-end' }]}>
              <Text>{getStatusLabel(invoice.status)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Paciente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>
              {invoice.patient.firstName} {invoice.patient.middleName || ''} {invoice.patient.lastName}
            </Text>
          </View>
          {invoice.patient.curp && (
            <View style={styles.row}>
              <Text style={styles.label}>CURP:</Text>
              <Text style={styles.value}>{invoice.patient.curp}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Emitido por:</Text>
            <Text style={styles.value}>{invoice.issuedBy.name}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conceptos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDescription, styles.headerText]}>Descripción</Text>
              <Text style={[styles.colQty, styles.headerText]}>Cant.</Text>
              <Text style={[styles.colPrice, styles.headerText]}>P. Unit.</Text>
              <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
            </View>
            {invoice.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colDescription}>{item.description}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
                <Text style={styles.colTotal}>{formatCurrency(item.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Subtotal:</Text>
            <Text>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.label}>Descuento:</Text>
              <Text>-{formatCurrency(invoice.discount)}</Text>
            </View>
          )}
          {invoice.tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.label}>Impuestos:</Text>
              <Text>{formatCurrency(invoice.tax)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Total:</Text>
            <Text>{formatCurrency(invoice.total)}</Text>
          </View>
          {invoice.payments.length > 0 && (
            <>
              <View style={[styles.totalRow, { marginTop: 8 }]}>
                <Text style={styles.label}>Pagado:</Text>
                <Text style={{ color: '#22c55e' }}>-{formatCurrency(totalPaid)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.label}>Pendiente:</Text>
                <Text style={{ color: pending > 0 ? '#f59e0b' : '#22c55e' }}>
                  {formatCurrency(pending)}
                </Text>
              </View>
            </>
          )}
        </View>

        {invoice.notes && (
          <View style={[styles.section, { marginTop: 30 }]}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Este documento es una representación impresa de un comprobante fiscal digital.
          Generated by HC GESTOR
        </Text>
      </Page>
    </Document>
  )
}

export async function generateInvoicePDF(invoice: Invoice, clinicName?: string) {
  const blob = await pdf(<InvoicePDF invoice={invoice} clinicName={clinicName} />).toBlob()
  return blob
}

export async function getInvoicePDFUrl(invoice: Invoice, clinicName?: string) {
  const blob = await generateInvoicePDF(invoice, clinicName)
  const url = URL.createObjectURL(blob)
  return url
}
