'use client'

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { ReportHeader, ReportFooter, SummaryCard, styles as baseStyles } from './report-layout'
import { PieChart, BarChart } from './report-charts'

const styles = StyleSheet.create({
  ...baseStyles,
  tableCellId: { width: '8%', fontSize: 7 },
  tableCellName: { width: '25%', fontSize: 7 },
  tableCellCurp: { width: '15%', fontSize: 7 },
  tableCellAge: { width: '8%', fontSize: 7 },
  tableCellGender: { width: '10%', fontSize: 7 },
  tableCellBloodType: { width: '10%', fontSize: 7 },
  tableCellPhone: { width: '14%', fontSize: 7 },
  tableCellDate: { width: '10%', fontSize: 7 },
})

interface Patient {
  id: string
  fullName: string
  curp: string | null
  age: number | null
  gender: string
  bloodType: string | null
  phone: string | null
  email: string | null
  createdAt: string
  appointmentsCount: number
  consultationsCount: number
}

interface PatientsReportData {
  patients: Patient[]
  summary: {
    totalPatients: number
    genderDistribution: { label: string; value: number; percentage: number }[]
    bloodTypeDistribution: { label: string; value: number; percentage: number }[]
  }
  filters: {
    startDate?: string
    endDate?: string
    gender?: string
    bloodType?: string
  }
  clinicInfo?: {
    name: string
    info?: string
  }
  generatedBy?: string
}

function PatientsReportDocument({ data }: { data: PatientsReportData }) {
  const { patients, summary, filters, clinicInfo, generatedBy } = data

  const genderData = summary.genderDistribution.map((g) => ({
    label: g.label === 'MALE' ? 'Masculino' : g.label === 'FEMALE' ? 'Femenino' : 'Otro',
    value: g.value,
  }))

  const bloodTypeData = summary.bloodTypeDistribution.map((b) => ({
    label: b.label,
    value: b.value,
  }))

  // Split patients into chunks for pagination
  const patientsPerPage = 20
  const patientChunks = []
  for (let i = 0; i < patients.length; i += patientsPerPage) {
    patientChunks.push(patients.slice(i, i + patientsPerPage))
  }

  return (
    <Document>
      {/* Page 1: Summary and Charts */}
      <Page size="A4" style={styles.page}>
        <ReportHeader
          title="Reporte de Pacientes"
          subtitle="Listado y estadísticas de pacientes registrados"
          periodStart={filters.startDate}
          periodEnd={filters.endDate}
          clinicName={clinicInfo?.name}
          clinicInfo={clinicInfo?.info}
          generatedBy={generatedBy}
        />

        {/* Summary Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen General</Text>
          <View style={styles.summaryGrid}>
            <SummaryCard label="Total de Pacientes" value={summary.totalPatients} />
            <SummaryCard
              label="Masculinos"
              value={genderData.find((g) => g.label === 'Masculino')?.value || 0}
            />
            <SummaryCard
              label="Femeninos"
              value={genderData.find((g) => g.label === 'Femenino')?.value || 0}
            />
            <SummaryCard label="Con CURP" value={patients.filter((p) => p.curp).length} />
          </View>
        </View>

        {/* Charts */}
        <View style={{ flexDirection: 'row', marginBottom: 15 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <PieChart data={genderData} title="Distribución por Género" />
          </View>
          <View style={{ flex: 1 }}>
            <BarChart data={bloodTypeData} title="Distribución por Tipo de Sangre" />
          </View>
        </View>

        <ReportFooter pageNumber={1} totalPages={patientChunks.length + 1} />
      </Page>

      {/* Pages with Patient Table */}
      {patientChunks.map((chunk, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Listado de Pacientes ({chunk.length} de {patients.length})
            </Text>

            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, styles.tableCellId]}>ID</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellName]}>Nombre</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellCurp]}>CURP</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellAge]}>Edad</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellGender]}>Género</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellBloodType]}>Tipo Sangre</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellPhone]}>Teléfono</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellDate]}>Registro</Text>
              </View>

              {/* Table Rows */}
              {chunk.map((patient, index) => (
                <View
                  key={patient.id}
                  style={[styles.tableRow, index % 2 === 1 ? styles.tableRowEven : {}]}
                >
                  <Text style={[styles.tableCell, styles.tableCellId]}>{patient.id.slice(-6)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellName]}>{patient.fullName}</Text>
                  <Text style={[styles.tableCell, styles.tableCellCurp]}>
                    {patient.curp || '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellAge]}>
                    {patient.age || '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellGender]}>
                    {patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : 'O'}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellBloodType]}>
                    {patient.bloodType || '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellPhone]}>
                    {patient.phone || '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellDate]}>
                    {new Date(patient.createdAt).toLocaleDateString('es-MX')}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <ReportFooter pageNumber={pageIndex + 2} totalPages={patientChunks.length + 1} />
        </Page>
      ))}
    </Document>
  )
}

export async function generatePatientsReportPDF(data: PatientsReportData): Promise<Blob> {
  const doc = <PatientsReportDocument data={data} />
  return await pdf(doc).toBlob()
}

export function getPatientsReportPDFUrl(data: PatientsReportData): string {
  const blob = generatePatientsReportPDF(data)
  return URL.createObjectURL(blob as unknown as Blob)
}

export type { PatientsReportData }
