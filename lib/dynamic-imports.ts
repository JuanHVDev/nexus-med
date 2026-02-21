/**
 * Dynamic imports for heavy PDF components
 * These functions lazy-load the PDF generation modules only when needed
 * reducing the initial bundle size by ~300KB
 */

// Type for PDF generation functions
type PDFGenerator<T> = (data: T) => Promise<Blob>

/**
 * Lazy load the medical report PDF generator
 */
export async function getMedicalReportPDFGenerator() {
  const { generateMedicalReportPDF } = await import(
    '@/components/reports/medical-report-pdf'
  )
  return generateMedicalReportPDF
}

/**
 * Lazy load the financial report PDF generator
 */
export async function getFinancialReportPDFGenerator() {
  const { generateFinancialReportPDF } = await import(
    '@/components/reports/financial-report-pdf'
  )
  return generateFinancialReportPDF
}

/**
 * Lazy load the appointments report PDF generator
 */
export async function getAppointmentsReportPDFGenerator() {
  const { generateAppointmentsReportPDF } = await import(
    '@/components/reports/appointments-report-pdf'
  )
  return generateAppointmentsReportPDF
}

/**
 * Lazy load the patients report PDF generator
 */
export async function getPatientsReportPDFGenerator() {
  const { generatePatientsReportPDF } = await import(
    '@/components/reports/patients-report-pdf'
  )
  return generatePatientsReportPDF
}

/**
 * Lazy load the prescription PDF generator
 */
export async function getPrescriptionPDFGenerator() {
  const { generatePrescriptionPDF } = await import(
    '@/components/prescriptions/prescription-pdf'
  )
  return generatePrescriptionPDF
}

/**
 * Lazy load the invoice PDF generator
 */
export async function getInvoicePDFGenerator() {
  const { generateInvoicePDF } = await import(
    '@/components/billing/invoice-pdf'
  )
  return generateInvoicePDF
}

/**
 * Lazy load the Excel export function
 */
export async function getExcelExporter() {
  const { exportToExcel, exportMultipleSheets } = await import(
    '@/lib/reports/excel-export'
  )
  return { exportToExcel, exportMultipleSheets }
}
