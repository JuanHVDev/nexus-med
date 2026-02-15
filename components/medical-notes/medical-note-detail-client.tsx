'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, User, Stethoscope, FileText, Activity, Pencil, Pill, Receipt, FlaskConical, ImageIcon, Check, Clock, AlertCircle } from 'lucide-react'
import { specialtyLabels } from '@/lib/validations/medical-note'
import { PrescriptionForm } from '@/components/prescriptions/prescription-form'
import { GenerateInvoiceDialog } from '@/components/billing/generate-invoice-dialog'
import { LabOrderForm } from '@/components/lab-orders/lab-order-form'
import { ImagingOrderForm } from '@/components/imaging-orders/imaging-order-form'

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

interface LabOrder {
  id: string
  patientId: string
  doctorId: string
  medicalNoteId: string | null
  orderDate: string
  tests: { name: string; code?: string }[]
  instructions: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  results: LabResult[]
}

interface LabResult {
  id: string
  labOrderId: string
  testName: string
  result: string | null
  unit: string | null
  referenceRange: string | null
  flag: string | null
}

interface ImagingOrder {
  id: string
  patientId: string
  doctorId: string
  medicalNoteId: string | null
  orderDate: string
  studyType: string
  bodyPart: string
  reason: string | null
  clinicalNotes: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  findings: string | null
  impression: string | null
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
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [labDialogOpen, setLabDialogOpen] = useState(false)
  const [imagingDialogOpen, setImagingDialogOpen] = useState(false)
  const [prescriptions, setPrescriptions] = useState(note.prescriptions || [])

  const hasPrescription = prescriptions.length > 0

  const { data: labOrders = [] } = useQuery<LabOrder[]>({
    queryKey: ['lab-orders', 'medicalNote', note.id],
    queryFn: async () => {
      const res = await fetch(`/api/lab-orders?medicalNoteId=${note.id}`)
      if (!res.ok) throw new Error('Error fetching lab orders')
      return res.json()
    },
    enabled: !!note.id,
  })

  const { data: imagingOrders = [] } = useQuery<ImagingOrder[]>({
    queryKey: ['imaging-orders', 'medicalNote', note.id],
    queryFn: async () => {
      const res = await fetch(`/api/imaging-orders?medicalNoteId=${note.id}`)
      if (!res.ok) throw new Error('Error fetching imaging orders')
      return res.json()
    },
    enabled: !!note.id,
  })

  const patientName = `${note.patient.firstName} ${note.patient.middleName || ''} ${note.patient.lastName}`.trim()

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
          <Button variant="outline" onClick={() => setInvoiceDialogOpen(true)}>
            <Receipt className="h-4 w-4 mr-2" />
            Generar Factura
          </Button>
          <Dialog open={labDialogOpen} onOpenChange={setLabDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FlaskConical className="h-4 w-4 mr-2" />
                Orden Laboratorio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Orden de Laboratorio</DialogTitle>
              </DialogHeader>
              <LabOrderForm
                patientId={patientId}
                doctorId={note.doctor.id}
                medicalNoteId={note.id}
                onSuccess={() => {
                  setLabDialogOpen(false)
                  router.refresh()
                }}
                onCancel={() => setLabDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={imagingDialogOpen} onOpenChange={setImagingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ImageIcon className="h-4 w-4 mr-2" />
                Orden Imagenología
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Orden de Imagenología</DialogTitle>
              </DialogHeader>
              <ImagingOrderForm
                patientId={patientId}
                doctorId={note.doctor.id}
                medicalNoteId={note.id}
                onSuccess={() => {
                  setImagingDialogOpen(false)
                  router.refresh()
                }}
                onCancel={() => setImagingDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
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

        {labOrders.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Órdenes de Laboratorio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {labOrders.map((order) => (
                <div key={order.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-muted-foreground text-sm">
                        {format(new Date(order.orderDate), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <Badge className={
                      order.status === 'COMPLETED' ? 'bg-green-500' :
                      order.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                      order.status === 'CANCELLED' ? 'bg-red-500' : 'bg-yellow-500'
                    }>
                      {order.status === 'COMPLETED' ? <Check className="h-3 w-3 mr-1" /> :
                       order.status === 'IN_PROGRESS' ? <Clock className="h-3 w-3 mr-1" /> :
                       order.status === 'CANCELLED' ? <AlertCircle className="h-3 w-3 mr-1" /> :
                       <Clock className="h-3 w-3 mr-1" />}
                      {order.status === 'COMPLETED' ? 'Completado' :
                       order.status === 'IN_PROGRESS' ? 'En proceso' :
                       order.status === 'CANCELLED' ? 'Cancelado' : 'Pendiente'}
                    </Badge>
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {order.tests.map((test, i) => (
                      <li key={i} className="text-sm">{test.name}</li>
                    ))}
                  </ul>
                  {order.results && order.results.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium mb-2">Resultados:</p>
                      <div className="space-y-1">
                        {order.results.map((result) => (
                          <div key={result.id} className="flex justify-between text-sm">
                            <span>{result.testName}</span>
                            <span className={result.flag === 'HIGH' || result.flag === 'LOW' || result.flag === 'CRITICAL' ? 'text-red-500 font-medium' : ''}>
                              {result.result} {result.unit && result.unit}
                              {result.flag && result.flag !== 'NORMAL' && ` (${result.flag})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {order.instructions && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Instrucciones:</strong> {order.instructions}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {imagingOrders.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Órdenes de Imagenología
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {imagingOrders.map((order) => (
                <div key={order.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-muted-foreground text-sm">
                        {format(new Date(order.orderDate), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <Badge className={
                      order.status === 'COMPLETED' ? 'bg-green-500' :
                      order.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                      order.status === 'CANCELLED' ? 'bg-red-500' : 'bg-yellow-500'
                    }>
                      {order.status === 'COMPLETED' ? <Check className="h-3 w-3 mr-1" /> :
                       order.status === 'IN_PROGRESS' ? <Clock className="h-3 w-3 mr-1" /> :
                       order.status === 'CANCELLED' ? <AlertCircle className="h-3 w-3 mr-1" /> :
                       <Clock className="h-3 w-3 mr-1" />}
                      {order.status === 'COMPLETED' ? 'Completado' :
                       order.status === 'IN_PROGRESS' ? 'En proceso' :
                       order.status === 'CANCELLED' ? 'Cancelado' : 'Pendiente'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm"><strong>Tipo:</strong> {order.studyType}</p>
                    <p className="text-sm"><strong>Región:</strong> {order.bodyPart}</p>
                    {order.reason && <p className="text-sm"><strong>Razón:</strong> {order.reason}</p>}
                  </div>
                  {order.findings && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium">Hallazgos:</p>
                      <p className="text-sm text-muted-foreground">{order.findings}</p>
                    </div>
                  )}
                  {order.impression && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Impresión:</p>
                      <p className="text-sm text-muted-foreground">{order.impression}</p>
                    </div>
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

      <GenerateInvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        medicalNoteId={note.id}
        patientId={patientId}
        patientName={patientName}
        doctorName={note.doctor.name}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
