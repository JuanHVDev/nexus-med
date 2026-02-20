'use client'

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { ReportHeader, ReportFooter, SummaryCard, styles as baseStyles } from './report-layout'
import { PieChart, BarChart, HorizontalBarChart } from './report-charts'

const styles = StyleSheet.create({
  ...baseStyles,
  tableCellDate: { width: '10%', fontSize: 7 },
  tableCellPatient: { width: '18%', fontSize: 7 },
  tableCellDoctor: { width: '15%', fontSize: 7 },
  tableCellSpecialty: { width: '12%', fontSize: 7 },
  tableCellDiagnosis: { width: '22%', fontSize: 7 },
  tableCellPrescriptions: { width: '10%', fontSize: 7, textAlign: 'center' },
  tableCellStudies: { width: '10%', fontSize: 7, textAlign: 'center' },
  badgeTrue: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 7,
    textAlign: 'center',
  },
  badgeFalse: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 7,
    textAlign: 'center',
  },
})

interface Consultation {
  id: string
  createdAt: string
  dateFormatted: string
  timeFormatted: string
  patientName: string
  doctorName: string
  specialty: string
  licenseNumber: string | null
  chiefComplaint: string
  diagnosis: string | null
  treatment: string | null
  hasPrescriptions: boolean
  prescriptionsCount: number
  hasLabOrders: boolean
  labOrdersCount: number
  hasImagingOrders: boolean
  imagingOrdersCount: number
}

interface MedicalReportData {
  consultations: Consultation[]
  summary: {
    totalConsultations: number
    totalPrescriptions: number
    totalLabOrders: number
    totalImagingOrders: number
    specialtyDistribution: { label: string; value: number }[]
    doctorDistribution: { label: string; value: number }[]
    topDiagnoses: { label: string; value: number }[]
    dailyDistribution: { date: string; count: number }[]
  }
  filters: {
    startDate?: string
    endDate?: string
    doctorId?: string
    specialty?: string
  }
  clinicInfo?: {
    name: string
    info?: string
  }
  generatedBy?: string
}

function MedicalReportDocument({ data }: { data: MedicalReportData }) {
  const { consultations, summary, filters, clinicInfo, generatedBy } = data

  const specialtyData = summary.specialtyDistribution.slice(0, 6).map((s) => ({
    label: s.label,
    value: s.value,
  }))

  const doctorData = summary.doctorDistribution.slice(0, 6).map((d) => ({
    label: d.label,
    value: d.value,
  }))

  const diagnosisData = summary.topDiagnoses.map((d) => ({
    label: d.label.length > 30 ? d.label.substring(0, 27) + '...' : d.label,
    value: d.value,
  }))

  // Split consultations into chunks
  const consultationsPerPage = 18
  const consultationChunks = []
  for (let i = 0; i < consultations.length; i += consultationsPerPage) {
    consultationChunks.push(consultations.slice(i, i + consultationsPerPage))
  }

  return (
    <Document>
      {/* Page 1: Summary and Charts */}
      <Page size="A4" style={styles.page}>
        <ReportHeader
          title="Reporte de Consultas Médicas"
          subtitle="Actividad médica y estadísticas clínicas"
          periodStart={filters.startDate}
          periodEnd={filters.endDate}
          clinicName={clinicInfo?.name}
          clinicInfo={clinicInfo?.info}
          generatedBy={generatedBy}
        />

        {/* Summary Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de Actividad Médica</Text>
          <View style={styles.summaryGrid}>
            <SummaryCard label="Total Consultas" value={summary.totalConsultations} />
            <SummaryCard label="Recetas Emitidas" value={summary.totalPrescriptions} />
            <SummaryCard label="Órdenes de Lab" value={summary.totalLabOrders} />
            <SummaryCard label="Órdenes de Imagen" value={summary.totalImagingOrders} />
          </View>
        </View>

        {/* Charts */}
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <PieChart data={specialtyData} title="Consultas por Especialidad" />
          </View>
          <View style={{ flex: 1 }}>
            <BarChart data={doctorData} title="Consultas por Médico" maxBars={6} />
          </View>
        </View>

        {diagnosisData.length > 0 && (
          <View style={{ marginTop: 5 }}>
            <HorizontalBarChart data={diagnosisData} title="Top 10 Diagnósticos" maxBars={8} />
          </View>
        )}

        <ReportFooter pageNumber={1} totalPages={consultationChunks.length + 1} />
      </Page>

      {/* Pages with Consultations Table */}
      {consultationChunks.map((chunk, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Listado de Consultas ({chunk.length} de {consultations.length})
            </Text>

            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, styles.tableCellDate]}>Fecha</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellPatient]}>Paciente</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellDoctor]}>Médico</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellSpecialty]}>Especialidad</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellDiagnosis]}>Diagnóstico</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellPrescriptions]}>Recetas</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellStudies]}>Estudios</Text>
              </View>

              {/* Table Rows */}
              {chunk.map((consultation, index) => (
                <View
                  key={consultation.id}
                  style={[styles.tableRow, index % 2 === 1 ? styles.tableRowEven : {}]}
                >
                  <Text style={[styles.tableCell, styles.tableCellDate]}>
                    {consultation.dateFormatted}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellPatient]}>
                    {consultation.patientName}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellDoctor]}>
                    {consultation.doctorName}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellSpecialty]}>
                    {consultation.specialty}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellDiagnosis]}>
                    {consultation.diagnosis?.substring(0, 40) || '-'}
                    {consultation.diagnosis && consultation.diagnosis.length > 40 ? '...' : ''}
                  </Text>
                  <View style={[styles.tableCell, styles.tableCellPrescriptions]}>
                    <Text style={consultation.hasPrescriptions ? styles.badgeTrue : styles.badgeFalse}>
                      {consultation.prescriptionsCount > 0 ? consultation.prescriptionsCount : 'No'}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.tableCellStudies]}>
                    <Text style={(consultation.hasLabOrders || consultation.hasImagingOrders) ? styles.badgeTrue : styles.badgeFalse}>
                      {consultation.labOrdersCount + consultation.imagingOrdersCount > 0 
                        ? consultation.labOrdersCount + consultation.imagingOrdersCount 
                        : 'No'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <ReportFooter pageNumber={pageIndex + 2} totalPages={consultationChunks.length + 1} />
        </Page>
      ))}
    </Document>
  )
}

export async function generateMedicalReportPDF(data: MedicalReportData): Promise<Blob> {
  const doc = <MedicalReportDocument data={data} />
  return await pdf(doc).toBlob()
}

export function getMedicalReportPDFUrl(data: MedicalReportData): string {
  const blob = generateMedicalReportPDF(data)
  return URL.createObjectURL(blob as unknown as Blob)
}

export type { MedicalReportData }
