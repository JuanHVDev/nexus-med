'use client'

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { ReportHeader, ReportFooter, SummaryCard, StatusBadge, styles as baseStyles } from './report-layout'
import { PieChart, BarChart, LineChart } from './report-charts'

const styles = StyleSheet.create({
  ...baseStyles,
  tableCellNumber: { width: '10%', fontSize: 7 },
  tableCellDate: { width: '10%', fontSize: 7 },
  tableCellPatient: { width: '20%', fontSize: 7 },
  tableCellDoctor: { width: '16%', fontSize: 7 },
  tableCellSubtotal: { width: '10%', fontSize: 7, textAlign: 'right' },
  tableCellTax: { width: '8%', fontSize: 7, textAlign: 'right' },
  tableCellDiscount: { width: '10%', fontSize: 7, textAlign: 'right' },
  tableCellTotal: { width: '10%', fontSize: 7, textAlign: 'right' },
  tableCellStatus: { width: '6%', fontSize: 7 },
  amount: {
    fontSize: 8,
    textAlign: 'right',
  },
  positiveAmount: {
    color: '#059669',
  },
  negativeAmount: {
    color: '#dc2626',
  },
})

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: string
  dateFormatted: string
  patientName: string
  doctorName: string
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
}

interface FinancialReportData {
  invoices: Invoice[]
  summary: {
    totalInvoices: number
    totalRevenue: number
    totalTax: number
    totalDiscounts: number
    paidAmount: number
    pendingAmount: number
    averageInvoice: number
    statusDistribution: { label: string; count: number; amount: number }[]
    paymentMethodDistribution: { label: string; count: number; amount: number }[]
    dailyRevenue: { date: string; amount: number }[]
    doctorRevenue: { doctor: string; amount: number }[]
  }
  filters: {
    startDate?: string
    endDate?: string
    doctorId?: string
    status?: string
  }
  clinicInfo?: {
    name: string
    info?: string
  }
  generatedBy?: string
}

function FinancialReportDocument({ data }: { data: FinancialReportData }) {
  const { invoices, summary, filters, clinicInfo, generatedBy } = data

  const statusData = summary.statusDistribution.map((s) => ({
    label: s.label,
    value: s.count,
  }))

  const doctorRevenueData = summary.doctorRevenue.slice(0, 6).map((d) => ({
    label: d.doctor,
    value: d.amount,
  }))

  const dailyRevenueData = summary.dailyRevenue.map((d) => ({
    label: new Date(d.date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
    value: d.amount,
  }))

  // Split invoices into chunks
  const invoicesPerPage = 18
  const invoiceChunks = []
  for (let i = 0; i < invoices.length; i += invoicesPerPage) {
    invoiceChunks.push(invoices.slice(i, i + invoicesPerPage))
  }

  return (
    <Document>
      {/* Page 1: Summary and Charts */}
      <Page size="A4" style={styles.page}>
        <ReportHeader
          title="Reporte Financiero"
          subtitle="Ingresos y estadísticas de facturación"
          periodStart={filters.startDate}
          periodEnd={filters.endDate}
          clinicName={clinicInfo?.name}
          clinicInfo={clinicInfo?.info}
          generatedBy={generatedBy}
        />

        {/* Summary Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen Financiero</Text>
          <View style={styles.summaryGrid}>
            <SummaryCard label="Ingresos Totales" value={formatCurrency(summary.totalRevenue)} />
            <SummaryCard label="Facturas" value={summary.totalInvoices} />
            <SummaryCard label="Monto Pagado" value={formatCurrency(summary.paidAmount)} />
            <SummaryCard label="Monto Pendiente" value={formatCurrency(summary.pendingAmount)} />
          </View>
          <View style={[styles.summaryGrid, { marginTop: 10 }]}>
            <SummaryCard label="Promedio por Factura" value={formatCurrency(summary.averageInvoice)} />
            <SummaryCard label="Total Impuestos" value={formatCurrency(summary.totalTax)} />
            <SummaryCard label="Total Descuentos" value={formatCurrency(summary.totalDiscounts)} />
            <SummaryCard label="Tasa de Cobro" value={`${summary.paidAmount > 0 ? Math.round((summary.paidAmount / (summary.paidAmount + summary.pendingAmount)) * 100) : 0}%`} />
          </View>
        </View>

        {/* Charts */}
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <PieChart data={statusData} title="Facturas por Estado" />
          </View>
          <View style={{ flex: 1 }}>
            <BarChart data={doctorRevenueData} title="Ingresos por Médico" maxBars={6} />
          </View>
        </View>

        {dailyRevenueData.length > 0 && (
          <View style={{ marginTop: 5 }}>
            <LineChart data={dailyRevenueData} title="Ingresos por Día" />
          </View>
        )}

        <ReportFooter pageNumber={1} totalPages={invoiceChunks.length + 1} />
      </Page>

      {/* Pages with Invoices Table */}
      {invoiceChunks.map((chunk, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Listado de Facturas ({chunk.length} de {invoices.length})
            </Text>

            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, styles.tableCellNumber]}>Folio</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellDate]}>Fecha</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellPatient]}>Paciente</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellDoctor]}>Médico</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellSubtotal]}>Subtotal</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellTax]}>IVA</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellDiscount]}>Desc.</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellTotal]}>Total</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellStatus]}>Est.</Text>
              </View>

              {/* Table Rows */}
              {chunk.map((invoice, index) => (
                <View
                  key={invoice.id}
                  style={[styles.tableRow, index % 2 === 1 ? styles.tableRowEven : {}]}
                >
                  <Text style={[styles.tableCell, styles.tableCellNumber]}>
                    {invoice.invoiceNumber}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellDate]}>
                    {invoice.dateFormatted}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellPatient]}>
                    {invoice.patientName}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellDoctor]}>
                    {invoice.doctorName}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellSubtotal]}>
                    {formatCurrency(invoice.subtotal)}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellTax]}>
                    {formatCurrency(invoice.tax)}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellDiscount]}>
                    {formatCurrency(invoice.discount)}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellTotal, { fontWeight: 'bold' }]}>
                    {formatCurrency(invoice.total)}
                  </Text>
                  <View style={[styles.tableCell, styles.tableCellStatus]}>
                    <StatusBadge status={invoice.status} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <ReportFooter pageNumber={pageIndex + 2} totalPages={invoiceChunks.length + 1} />
        </Page>
      ))}
    </Document>
  )
}

export async function generateFinancialReportPDF(data: FinancialReportData): Promise<Blob> {
  const doc = <FinancialReportDocument data={data} />
  return await pdf(doc).toBlob()
}

export function getFinancialReportPDFUrl(data: FinancialReportData): string {
  const blob = generateFinancialReportPDF(data)
  return URL.createObjectURL(blob as unknown as Blob)
}

export type { FinancialReportData }
