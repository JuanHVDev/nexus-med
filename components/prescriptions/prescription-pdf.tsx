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
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 100,
    color: '#666',
  },
  value: {
    flex: 1,
    fontWeight: 'normal',
  },
  medTable: {
    marginTop: 10,
    marginBottom: 20,
  },
  medHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  medRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  colMed: {
    width: '30%',
  },
  colDose: {
    width: '20%',
  },
  colRoute: {
    width: '15%',
  },
  colFreq: {
    width: '20%',
  },
  colDur: {
    width: '15%',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#999',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  signature: {
    marginTop: 40,
    alignItems: 'center',
  },
  signatureLine: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 4,
    textAlign: 'center',
  },
  instructions: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  validity: {
    marginTop: 20,
    fontSize: 9,
    color: '#666',
  },
})

interface Medication {
  name: string
  dosage: string
  route: string
  frequency?: string
  duration?: string
  instructions?: string
}

interface Patient {
  firstName: string
  lastName: string
  middleName: string | null
  curp: string | null
}

interface Doctor {
  name: string
  specialty: string | null
  licenseNumber: string | null
}

interface Prescription {
  id: string
  issueDate: string
  validUntil: string | null
  instructions: string | null
  medications: Medication[]
  patient: Patient
  doctor: Doctor
}

interface PrescriptionPDFProps {
  prescription: Prescription
  clinicName?: string
}

const routeLabels: Record<string, string> = {
  ORAL: 'Oral',
  INTRAVENOUS: 'Intravenosa',
  INTRAMUSCULAR: 'Intramuscular',
  SUBCUTANEOUS: 'Subcutánea',
  TOPICAL: 'Tópica',
  INHALED: 'Inhalada',
  SUBLINGUAL: 'Sublingual',
  RECTAL: 'Rectal',
  OPHTHALMIC: 'Oftálmica',
  OTIC: 'Ótica',
  NASAL: 'Nasal',
}

export function PrescriptionPDF({ prescription, clinicName = 'HC GESTOR' }: PrescriptionPDFProps) {
  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy', { locale: es })
  }

  const getRouteLabel = (route: string) => {
    return routeLabels[route] || route
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{clinicName}</Text>
          <Text style={styles.subtitle}>Receta Médica</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Paciente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>
              {prescription.patient.firstName} {prescription.patient.middleName || ''} {prescription.patient.lastName}
            </Text>
          </View>
          {prescription.patient.curp && (
            <View style={styles.row}>
              <Text style={styles.label}>CURP:</Text>
              <Text style={styles.value}>{prescription.patient.curp}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Fecha:</Text>
            <Text style={styles.value}>{formatDate(prescription.issueDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Médico</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Dr(a):</Text>
            <Text style={styles.value}>{prescription.doctor.name}</Text>
          </View>
          {prescription.doctor.specialty && (
            <View style={styles.row}>
              <Text style={styles.label}>Especialidad:</Text>
              <Text style={styles.value}>{prescription.doctor.specialty}</Text>
            </View>
          )}
          {prescription.doctor.licenseNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>Cédula:</Text>
              <Text style={styles.value}>{prescription.doctor.licenseNumber}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medicamentos</Text>
          <View style={styles.medTable}>
            <View style={styles.medHeader}>
              <Text style={[styles.colMed, styles.headerText]}>Medicamento</Text>
              <Text style={[styles.colDose, styles.headerText]}>Dosis</Text>
              <Text style={[styles.colRoute, styles.headerText]}>Vía</Text>
              <Text style={[styles.colFreq, styles.headerText]}>Frecuencia</Text>
              <Text style={[styles.colDur, styles.headerText]}>Duración</Text>
            </View>
            {prescription.medications.map((med, index) => (
              <View key={index} style={styles.medRow}>
                <Text style={styles.colMed}>{med.name}</Text>
                <Text style={styles.colDose}>{med.dosage}</Text>
                <Text style={styles.colRoute}>{getRouteLabel(med.route)}</Text>
                <Text style={styles.colFreq}>{med.frequency || '-'}</Text>
                <Text style={styles.colDur}>{med.duration || '-'}</Text>
              </View>
            ))}
          </View>
        </View>

        {prescription.instructions && (
          <View style={styles.instructions}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Instrucciones:</Text>
            <Text>{prescription.instructions}</Text>
          </View>
        )}

        {prescription.validUntil && (
          <View style={styles.validity}>
            <Text>Válido hasta: {formatDate(prescription.validUntil)}</Text>
          </View>
        )}

        <View style={styles.signature}>
          <View style={styles.signatureLine}>
            <Text>Firma del médico</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Este documento es una receta médica. Generated by HC GESTOR
        </Text>
      </Page>
    </Document>
  )
}

export async function generatePrescriptionPDF(prescription: Prescription, clinicName?: string) {
  const blob = await pdf(<PrescriptionPDF prescription={prescription} clinicName={clinicName} />).toBlob()
  return blob
}

export async function getPrescriptionPDFUrl(prescription: Prescription, clinicName?: string) {
  const blob = await generatePrescriptionPDF(prescription, clinicName)
  const url = URL.createObjectURL(blob)
  return url
}
