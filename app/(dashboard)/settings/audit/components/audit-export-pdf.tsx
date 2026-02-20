'use client'

import { useState } from 'react'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AUDIT_ACTION_LABELS, ENTITY_TYPE_LABELS, type AuditAction, type EntityType, type AuditLog } from '@/lib/audit/types'

interface AuditExportPDFProps {
  logs: AuditLog[]
  filters: {
    action: AuditAction | 'ALL'
    entityType: EntityType | 'ALL'
    startDate: string
    endDate: string
  }
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  filtersContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  filterText: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 2,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #f3f4f6',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableCell: {
    fontSize: 8,
  },
  colDate: { width: '18%' },
  colUser: { width: '15%' },
  colAction: { width: '12%' },
  colType: { width: '15%' },
  colEntity: { width: '25%' },
  colIP: { width: '15%' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9ca3af',
  },
})

function AuditPDFDocument({ logs, filters, generatedAt }: { 
  logs: AuditLog[]
  filters: AuditExportPDFProps['filters']
  generatedAt: string 
}) {
  const filterDescriptions: string[] = []
  
  if (filters.action !== 'ALL') {
    filterDescriptions.push(`Accion: ${AUDIT_ACTION_LABELS[filters.action]}`)
  }
  if (filters.entityType !== 'ALL') {
    filterDescriptions.push(`Tipo: ${ENTITY_TYPE_LABELS[filters.entityType]}`)
  }
  if (filters.startDate) {
    filterDescriptions.push(`Desde: ${filters.startDate}`)
  }
  if (filters.endDate) {
    filterDescriptions.push(`Hasta: ${filters.endDate}`)
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Registro de Auditoria</Text>
          <Text style={styles.subtitle}>HC Gestor - Historia Clinica</Text>
          <Text style={styles.subtitle}>Generado: {generatedAt}</Text>
        </View>

        {filterDescriptions.length > 0 && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filterText}>Filtros aplicados:</Text>
            {filterDescriptions.map((desc, i) => (
              <Text key={i} style={styles.filterText}>- {desc}</Text>
            ))}
            <Text style={styles.filterText}>Total de registros: {logs.length}</Text>
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.colDate]}>Fecha/Hora</Text>
            <Text style={[styles.tableCell, styles.colUser]}>Usuario</Text>
            <Text style={[styles.tableCell, styles.colAction]}>Accion</Text>
            <Text style={[styles.tableCell, styles.colType]}>Tipo</Text>
            <Text style={[styles.tableCell, styles.colEntity]}>Registro</Text>
            <Text style={[styles.tableCell, styles.colIP]}>IP</Text>
          </View>

          {logs.map((log, index) => (
            <View key={log.id || index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDate]}>
                {format(new Date(log.createdAt), "dd/MM/yy HH:mm", { locale: es })}
              </Text>
              <Text style={[styles.tableCell, styles.colUser]}>{log.userName}</Text>
              <Text style={[styles.tableCell, styles.colAction]}>
                {AUDIT_ACTION_LABELS[log.action]}
              </Text>
              <Text style={[styles.tableCell, styles.colType]}>
                {ENTITY_TYPE_LABELS[log.entityType as EntityType] || log.entityType}
              </Text>
              <Text style={[styles.tableCell, styles.colEntity]}>
                {log.entityName || log.entityId}
              </Text>
              <Text style={[styles.tableCell, styles.colIP]}>{log.ipAddress || '-'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>HC Gestor - Registro de Auditoria</Text>
          <Text>Pagina 1 de 1</Text>
        </View>
      </Page>
    </Document>
  )
}

export function AuditExportPDF({ logs, filters }: AuditExportPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleExport = async () => {
    setIsGenerating(true)
    try {
      const generatedAt = format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: es })
      const doc = <AuditPDFDocument logs={logs} filters={filters} generatedAt={generatedAt} />
      const blob = await pdf(doc).toBlob()
      
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = `auditoria-${format(new Date(), "yyyy-MM-dd")}.pdf`
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={isGenerating || logs.length === 0}>
      {isGenerating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      Exportar PDF
    </Button>
  )
}
