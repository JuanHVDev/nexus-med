'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, User, Stethoscope, FileText, Activity, Pencil, Pill } from 'lucide-react'
import { specialtyLabels } from '@/lib/validations/medical-note'
import { PrescriptionForm } from '@/components/prescriptions/prescription-form'

interface Patient {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  curp: string | null
}

interface Doctor {
  id: string
  name: string
  specialty: string | null
  licenseNumber: string | null
}

interface VitalSigns {
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  heartRate?: number
  temperature?: number
  oxygenSaturation?: number
  weight?: number
  height?: number
  respiratoryRate?: number
}

interface Prescription {
  id: string
  medications: { name: string; dosage: string; route: string }[]
  instructions: string | null
  createdAt: string
  doctor: {
    name: string
  }
}

interface Note {
  id: string
  createdAt: Date
  chiefComplaint: string
  currentIllness: string | null
  physicalExam: string | null
  diagnosis: string
  prognosis: string | null
  treatment: string | null
  notes: string | null
  specialty: string | null
  type: string | null
  patient: Patient
  doctor: Doctor
  prescriptions?: Prescription[]
  vitalSigns?: VitalSigns | null
}

interface MedicalNoteDetailClientProps {
  note: Note
  patientId: string
}

export function MedicalNoteDetailClient({ note, patientId }: MedicalNoteDetailClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [prescriptions, setPrescriptions] = useState(note.prescriptions || [])

  const hasPrescription = prescriptions.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/patients/${patientId}/notes`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Nota Médica</h1>
          <p className="text-muted-foreground">
            Fecha: {format(new Date(note.createdAt), 'dd MMMM yyyy HH:mm', { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          {!hasPrescription && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Pill className="h-4 w-4 mr-2" />
                  Crear Receta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nueva Receta Médica</DialogTitle>
                </DialogHeader>
                <PrescriptionForm
                  patientId={patientId}
                  medicalNoteId={note.id}
                  onSuccess={() => {
                    setDialogOpen(false)
                    router.refresh()
                  }}
                  onCancel={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
          <Button asChild>
            <Link href={`/patients/${patientId}/notes/${note.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar Nota
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground block text-sm">Nombre</span>
                <span className="font-medium text-lg">
                  {note.patient.firstName} {note.patient.middleName || ''} {note.patient.lastName}
                </span>
              </div>
              {note.patient.curp && (
                <div>
                  <span className="text-muted-foreground block text-sm">CURP</span>
                  <span className="font-mono">{note.patient.curp}</span>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/patients/${patientId}`}>
                  Ver Expediente Completo
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Médico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground block text-sm">Doctor</span>
                <span className="font-medium">Dr. {note.doctor.name}</span>
              </div>
              {note.doctor.specialty && (
                <div>
                  <span className="text-muted-foreground block text-sm">Especialidad</span>
                  <span>{specialtyLabels[note.doctor.specialty as keyof typeof specialtyLabels] || note.doctor.specialty}</span>
                </div>
              )}
              {note.doctor.licenseNumber && (
                <div>
                  <span className="text-muted-foreground block text-sm">Cédula</span>
                  <span>{note.doctor.licenseNumber}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {note.vitalSigns && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Signos Vitales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {note.vitalSigns.bloodPressureSystolic && (
                  <div>
                    <span className="text-muted-foreground block text-sm">PA</span>
                    <span className="font-medium">{note.vitalSigns.bloodPressureSystolic}/{note.vitalSigns.bloodPressureDiastolic} mmHg</span>
                  </div>
                )}
                {note.vitalSigns.heartRate && (
                  <div>
                    <span className="text-muted-foreground block text-sm">FC</span>
                    <span className="font-medium">{note.vitalSigns.heartRate} lpm</span>
                  </div>
                )}
                {note.vitalSigns.temperature && (
                  <div>
                    <span className="text-muted-foreground block text-sm">Temperatura</span>
                    <span className="font-medium">{note.vitalSigns.temperature} °C</span>
                  </div>
                )}
                {note.vitalSigns.oxygenSaturation && (
                  <div>
                    <span className="text-muted-foreground block text-sm">SpO2</span>
                    <span className="font-medium">{note.vitalSigns.oxygenSaturation}%</span>
                  </div>
                )}
                {note.vitalSigns.weight && (
                  <div>
                    <span className="text-muted-foreground block text-sm">Peso</span>
                    <span className="font-medium">{note.vitalSigns.weight} kg</span>
                  </div>
                )}
                {note.vitalSigns.height && (
                  <div>
                    <span className="text-muted-foreground block text-sm">Altura</span>
                    <span className="font-medium">{note.vitalSigns.height} cm</span>
                  </div>
                )}
                {note.vitalSigns.respiratoryRate && (
                  <div>
                    <span className="text-muted-foreground block text-sm">FR</span>
                    <span className="font-medium">{note.vitalSigns.respiratoryRate} rpm</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {hasPrescription && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Receta(s) Médica(s)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-muted-foreground text-sm">Dr. {prescription.doctor.name}</span>
                      <span className="text-muted-foreground text-sm ml-4">
                        {format(new Date(prescription.createdAt), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {prescription.medications.length} medicamento{prescription.medications.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {prescription.medications.map((med, i) => (
                      <li key={i} className="text-sm">
                        <strong>{med.name}</strong> - {med.dosage} ({med.route})
                      </li>
                    ))}
                  </ul>
                  {prescription.instructions && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Instrucciones:</strong> {prescription.instructions}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Nota Médica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-muted-foreground block text-sm">Motivo de Consulta</span>
              <p>{note.chiefComplaint}</p>
            </div>
            
            {note.currentIllness && (
              <div>
                <span className="text-muted-foreground block text-sm">Padecimiento Actual</span>
                <p>{note.currentIllness}</p>
              </div>
            )}

            {note.physicalExam && (
              <div>
                <span className="text-muted-foreground block text-sm">Exploración Física</span>
                <p className="whitespace-pre-wrap">{note.physicalExam}</p>
              </div>
            )}

            <div>
              <span className="text-muted-foreground block text-sm">Diagnóstico</span>
              <p className="font-medium">{note.diagnosis}</p>
            </div>

            {note.prognosis && (
              <div>
                <span className="text-muted-foreground block text-sm">Pronóstico</span>
                <p>{note.prognosis}</p>
              </div>
            )}

            {note.treatment && (
              <div>
                <span className="text-muted-foreground block text-sm">Tratamiento</span>
                <p className="whitespace-pre-wrap">{note.treatment}</p>
              </div>
            )}

            {note.notes && (
              <div>
                <span className="text-muted-foreground block text-sm">Notas Adicionales</span>
                <p>{note.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
