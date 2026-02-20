import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserClinicId } from '@/lib/clinic'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Edit, ArrowLeft, Phone, Mail, Calendar, AlertCircle, FileText, Clock, Eye, Check, FlaskConical, ImageIcon } from 'lucide-react'
export default async function PatientDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) throw new Error('Unauthorized')
  const { id } = await params

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) throw new Error('No clinic assigned')
  const now = new Date()

  const [patient, nextAppointment, recentNotes, labOrders, imagingOrders] = await Promise.all([
    prisma.patient.findFirst({
      where: { id: BigInt(id), clinicId },
      include: {
        medicalHistory: true,
        emergencyContacts: true,
        _count: { select: { appointments: true, medicalNotes: true } }
      }
    }),
    prisma.appointment.findFirst({
      where: { 
        patientId: BigInt(id), 
        status: 'SCHEDULED',
        startTime: { gte: now }
      },
      orderBy: { startTime: 'asc' },
      include: { doctor: { select: { name: true } } }
    }),
    prisma.medicalNote.findMany({
      where: { patientId: BigInt(id) },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { doctor: { select: { name: true } } }
    }),
    prisma.labOrder.findMany({
      where: { patientId: BigInt(id) },
      orderBy: { orderDate: 'desc' },
      take: 3,
      include: { doctor: { select: { name: true } } }
    }),
    prisma.imagingOrder.findMany({
      where: { patientId: BigInt(id) },
      orderBy: { orderDate: 'desc' },
      take: 3,
      include: { doctor: { select: { name: true } } }
    }),
  ])

  if (!patient) notFound()
  const bloodTypeLabels: Record<string, string> = {
    A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
    AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/patients">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {patient.lastName} {patient.firstName} {patient.middleName}
            </h1>
            <p className="text-muted-foreground">Paciente desde {new Date(patient.createdAt).toLocaleDateString('es-MX')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/patients/${patient.id}/notes`}>
            <Button variant="outline"><FileText className="h-4 w-4 mr-2" />Notas</Button>
          </Link>
          <Link href={`/patients/${patient.id}/history`}>
            <Button variant="outline"><FileText className="h-4 w-4 mr-2" /> Historial</Button>
          </Link>
          <Link href={`/patients/${patient.id}/edit`}>
            <Button><Edit className="h-4 w-4 mr-2" /> Editar</Button>
          </Link>
        </div>
      </div>

      {/* Alerta de alergias */}
      {patient.medicalHistory && patient.medicalHistory.allergies.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Alergias: </span>
              <span>{patient.medicalHistory.allergies.join(', ')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Información Personal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><p className="text-sm text-muted-foreground">CURP</p><p className="font-medium">{patient.curp || 'No registrado'}</p></div>
            <div><p className="text-sm text-muted-foreground">Fecha de Nacimiento</p><p className="font-medium">{new Date(patient.birthDate).toLocaleDateString('es-MX')}</p></div>
            <div><p className="text-sm text-muted-foreground">Género</p><p className="font-medium">{patient.gender}</p></div>
            <div><p className="text-sm text-muted-foreground">Tipo de Sangre</p><Badge>{patient.bloodType ? bloodTypeLabels[patient.bloodType] : 'No registrado'}</Badge></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Contacto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{patient.phone || patient.mobile || 'No registrado'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{patient.email || 'No registrado'}</span>
            </div>
            {patient.address && (
              <div><p className="text-sm text-muted-foreground">Dirección</p><p className="font-medium">{patient.address}</p></div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Próxima Cita</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {nextAppointment ? (
              <>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{new Date(nextAppointment.startTime).toLocaleDateString('es-MX')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(nextAppointment.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-muted-foreground">Dr. {nextAppointment.doctor.name}</p>
                {nextAppointment.reason && <p className="text-sm">{nextAppointment.reason}</p>}
              </>
            ) : (
              <p className="text-muted-foreground">No hay citas agendadas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expediente Médico Resumido */}
      {patient.medicalHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Historial Médico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Alergias</p>
                <p className="font-medium">{patient.medicalHistory.allergies.length || 'Ninguna'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Medicamentos</p>
                <p className="font-medium">{patient.medicalHistory.currentMedications.length || 'Ninguno'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enfermedades Crónicas</p>
                <p className="font-medium">{patient.medicalHistory.chronicDiseases.length || 'Ninguna'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cirugías</p>
                <p className="font-medium">{patient.medicalHistory.surgeries.length || 'Ninguna'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Últimas Consultas */}
      {recentNotes.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimas Consultas</CardTitle>
            <Link href={`/patients/${patient.id}/notes/new`}>
              <Button size="sm"><FileText className="h-4 w-4 mr-2" />Nueva Nota</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentNotes.map(note => (
                <div key={note.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{new Date(note.createdAt).toLocaleDateString('es-MX')}</p>
                    <p className="text-sm text-muted-foreground">Dr. {note.doctor.name}</p>
                    {note.chiefComplaint && <p className="text-sm mt-1">{note.chiefComplaint}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/patients/${patient.id}/notes/${note.id}`}>
                      <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />Ver</Button>
                    </Link>
                    <Link href={`/patients/${patient.id}/notes/${note.id}/edit`}>
                      <Button variant="ghost" size="sm"><Edit className="h-4 w-4 mr-1" />Editar</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Órdenes de Laboratorio */}
      {labOrders && labOrders.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Órdenes de Laboratorio
            </CardTitle>
            <Link href={`/lab-orders?patientId=${patient.id}`}>
              <Button size="sm" variant="outline">Ver Todas</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {labOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">
                    {order.tests && Array.isArray(order.tests) 
                      ? order.tests.map((t: unknown) => (t as { name?: string })?.name).filter(Boolean).join(', ')
                      : 'Estudios múltiples'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.orderDate).toLocaleDateString('es-MX')} • Dr. {order.doctor.name}
                  </p>
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
            ))}
          </CardContent>
        </Card>
      )}

      {/* Órdenes de Imagenología */}
      {imagingOrders && imagingOrders.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Órdenes de Imagenología
            </CardTitle>
            <Link href={`/imaging-orders?patientId=${patient.id}`}>
              <Button size="sm" variant="outline">Ver Todas</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {imagingOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{order.studyType} - {order.bodyPart}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.orderDate).toLocaleDateString('es-MX')} • Dr. {order.doctor.name}
                  </p>
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
            ))}
          </CardContent>
        </Card>
      )}

      {/* Contactos de Emergencia */}
      {patient.emergencyContacts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Contactos de Emergencia</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patient.emergencyContacts.map(contact => (
                <div key={contact.id} className="p-4 border rounded-lg">
                  <p className="font-medium">{contact.name} {contact.isPrimary && <Badge className="ml-2">Principal</Badge>}</p>
                  <p className="text-sm text-muted-foreground">{contact.relation}</p>
                  <p className="text-sm">{contact.phone}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}