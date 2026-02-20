// Report PDF Components
export { 
  generatePatientsReportPDF, 
  getPatientsReportPDFUrl,
  type PatientsReportData 
} from './patients-report-pdf'

export { 
  generateAppointmentsReportPDF, 
  getAppointmentsReportPDFUrl,
  type AppointmentsReportData 
} from './appointments-report-pdf'

export { 
  generateFinancialReportPDF, 
  getFinancialReportPDFUrl,
  type FinancialReportData 
} from './financial-report-pdf'

export { 
  generateMedicalReportPDF, 
  getMedicalReportPDFUrl,
  type MedicalReportData 
} from './medical-report-pdf'

// Layout Components
export {
  ReportHeader,
  ReportFooter,
  SummaryCard,
  StatusBadge,
  styles as reportStyles,
} from './report-layout'

// Chart Components
export {
  PieChart,
  BarChart,
  LineChart,
  HorizontalBarChart,
} from './report-charts'
