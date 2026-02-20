'use client'

import { Text, View, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  clinicName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  clinicInfo: {
    fontSize: 8,
    color: '#666',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 9,
    color: '#666',
  },
  periodInfo: {
    fontSize: 9,
    color: '#666',
    marginTop: 8,
  },
  generatedInfo: {
    fontSize: 8,
    color: '#999',
    marginTop: 4,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    backgroundColor: '#f3f4f6',
    padding: 6,
    borderRadius: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  summaryCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 5,
  },
  tableRowEven: {
    backgroundColor: '#fafafa',
  },
  tableCell: {
    fontSize: 8,
    color: '#333',
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  pageNumber: {
    fontSize: 8,
    color: '#999',
  },
  chartContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chartTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 7,
  },
  badgeBlue: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  badgeGreen: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  badgeRed: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  badgeYellow: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  badgeGray: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
})

export { styles }

interface ReportHeaderProps {
  title: string
  subtitle?: string
  periodStart?: string
  periodEnd?: string
  clinicName?: string
  clinicInfo?: string
  generatedBy?: string
}

export function ReportHeader({
  title,
  subtitle,
  periodStart,
  periodEnd,
  clinicName = 'Clínica',
  clinicInfo = '',
  generatedBy,
}: ReportHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.logo}>HC Gestor</Text>
        <Text style={styles.clinicName}>{clinicName}</Text>
        {clinicInfo && <Text style={styles.clinicInfo}>{clinicInfo}</Text>}
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.reportTitle}>{title}</Text>
        {subtitle && <Text style={styles.reportSubtitle}>{subtitle}</Text>}
        {(periodStart || periodEnd) && (
          <Text style={styles.periodInfo}>
            Período: {periodStart ? format(new Date(periodStart), 'dd/MM/yyyy', { locale: es }) : 'Inicio'} - {periodEnd ? format(new Date(periodEnd), 'dd/MM/yyyy', { locale: es }) : 'Actual'}
          </Text>
        )}
        <Text style={styles.generatedInfo}>
          Generado: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
          {generatedBy && ` por ${generatedBy}`}
        </Text>
      </View>
    </View>
  )
}

export function ReportFooter({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) {
  return (
    <View style={styles.footer} fixed>
      <Text>HC Gestor - Sistema de Historia Clínica</Text>
      <Text style={styles.pageNumber}>Página {pageNumber} de {totalPages}</Text>
    </View>
  )
}

export function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const getStatusStyle = () => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
      case 'PAID':
        return styles.badgeGreen
      case 'PENDING':
      case 'SCHEDULED':
        return styles.badgeYellow
      case 'CANCELLED':
      case 'NO_SHOW':
        return styles.badgeRed
      case 'CONFIRMED':
      case 'PARTIAL':
        return styles.badgeBlue
      default:
        return styles.badgeGray
    }
  }

  const getStatusLabel = () => {
    const labels: Record<string, string> = {
      COMPLETED: 'Completada',
      PAID: 'Pagada',
      PENDING: 'Pendiente',
      SCHEDULED: 'Programada',
      CANCELLED: 'Cancelada',
      NO_SHOW: 'No asistió',
      CONFIRMED: 'Confirmada',
      PARTIAL: 'Parcial',
      IN_PROGRESS: 'En progreso',
    }
    return labels[status.toUpperCase()] || status
  }

  return (
    <View style={[styles.badge, getStatusStyle()]}>
      <Text style={{ fontSize: 7 }}>{getStatusLabel()}</Text>
    </View>
  )
}
