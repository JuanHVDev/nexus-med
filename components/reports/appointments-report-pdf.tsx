'use client'

import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { ReportHeader, ReportFooter, SummaryCard, StatusBadge, styles as baseStyles } from './report-layout'
import { PieChart, BarChart, LineChart } from './report-charts'

const styles = StyleSheet.create({
  ...baseStyles,
  tableCellDate: { width: '12%', fontSize: 7 },
  tableCellTime: { width: '8%', fontSize: 7 },
  tableCellPatient: { width: '22%', fontSize: 7 },
  tableCellDoctor: { width: '18%', fontSize: 7 },
  tableCellSpecialty: { width: '14%', fontSize: 7 },
  tableCellStatus: { width: '12%', fontSize: 7 },
  tableCellReason: { width: '14%', fontSize: 7 },
})

interface Appointment {
  id: string
  startTime: string
  endTime: string
  dateFormatted: string
  timeFormatted: string
  patientName: string
  doctorName: string
  specialty: string
  status: string
  reason: string | null
}

interface AppointmentsReportData {
  appointments: Appointment[]
  summary: {
    totalAppointments: number
    attendanceRate: number
    statusDistribution: { label: string; value: number; percentage: number }[]
    doctorDistribution: { label: string; value: number }[]
    dailyDistribution: { date: string; count: number }[]
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

function AppointmentsReportDocument({ data }: { data: AppointmentsReportData }) {
  const { appointments, summary, filters, clinicInfo, generatedBy } = data

  const statusData = summary.statusDistribution.map((s) => ({
    label: s.label,
    value: s.value,
  }))

  const doctorData = summary.doctorDistribution.slice(0, 8).map((d) => ({
    label: d.label,
    value: d.value,
  }))

  const dailyData = summary.dailyDistribution.map((d) => ({
    label: new Date(d.date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
    value: d.count,
  }))

  // Split appointments into chunks
  const appointmentsPerPage = 20
  const appointmentChunks = []
  for (let i = 0; i < appointments.length; i += appointmentsPerPage) {
    appointmentChunks.push(appointments.slice(i, i + appointmentsPerPage))
  }

  return (
    <Document>
      {/* Page 1: Summary and Charts */}
      <Page size="A4" style={styles.page}>
        <ReportHeader
          title="Reporte de Citas"
          subtitle="Agenda y estadísticas de citas médicas"
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
            <SummaryCard label="Total de Citas" value={summary.totalAppointments} />
            <SummaryCard label="Tasa de Asistencia" value={`${summary.attendanceRate}%`} />
            <SummaryCard
              label="Completadas"
              value={summary.statusDistribution.find((s) => s.label === 'COMPLETED')?.value || 0}
            />
            <SummaryCard
              label="Canceladas"
              value={summary.statusDistribution.find((s) => s.label === 'CANCELLED')?.value || 0}
            />
          </View>
        </View>

        {/* Charts */}
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <PieChart data={statusData} title="Distribución por Estado" />
          </View>
          <View style={{ flex: 1 }}>
            <BarChart data={doctorData} title="Citas por Médico" maxBars={6} />
          </View>
        </View>

        {dailyData.length > 0 && (
          <View style={{ marginTop: 5 }}>
            <LineChart data={dailyData} title="Citas por Día" />
          </View>
        )}

        <ReportFooter pageNumber={1} totalPages={appointmentChunks.length + 1} />
      </Page>

      {/* Pages with Appointments Table */}
      {appointmentChunks.map((chunk, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Listado de Citas ({chunk.length} de {appointments.length})
            </Text>

            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, styles.tableCellDate]}>Fecha</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellTime]}>Hora</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellPatient]}>Paciente</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellDoctor]}>Médico</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellSpecialty]}>Especialidad</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellStatus]}>Estado</Text>
                <Text style={[styles.tableCellHeader, styles.tableCellReason]}>Motivo</Text>
              </View>

              {/* Table Rows */}
              {chunk.map((appointment, index) => (
                <View
                  key={appointment.id}
                  style={[styles.tableRow, index % 2 === 1 ? styles.tableRowEven : {}]}
                >
                  <Text style={[styles.tableCell, styles.tableCellDate]}>
                    {appointment.dateFormatted}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellTime]}>
                    {appointment.timeFormatted}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellPatient]}>
                    {appointment.patientName}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellDoctor]}>
                    {appointment.doctorName}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellSpecialty]}>
                    {appointment.specialty}
                  </Text>
                  <View style={[styles.tableCell, styles.tableCellStatus]}>
                    <StatusBadge status={appointment.status} />
                  </View>
                  <Text style={[styles.tableCell, styles.tableCellReason]}>
                    {appointment.reason || '-'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <ReportFooter pageNumber={pageIndex + 2} totalPages={appointmentChunks.length + 1} />
        </Page>
      ))}
    </Document>
  )
}

export async function generateAppointmentsReportPDF(data: AppointmentsReportData): Promise<Blob> {
  const doc = <AppointmentsReportDocument data={data} />
  return await pdf(doc).toBlob()
}

export function getAppointmentsReportPDFUrl(data: AppointmentsReportData): string {
  const blob = generateAppointmentsReportPDF(data)
  return URL.createObjectURL(blob as unknown as Blob)
}

export type { AppointmentsReportData }
