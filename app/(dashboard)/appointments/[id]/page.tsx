import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserClinicId } from "@/lib/clinic"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Calendar, User, Stethoscope, FileText } from "lucide-react"
import { StatusChangeButton } from "@/components/appointments/status-change-button"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AppointmentDetailPage({ params }: PageProps) {
  const { id } = await params
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session) {
    return <div>No autorizado</div>
  }

  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) {
    return <div>No autorizado</div>
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: BigInt(id),
      clinicId
    },
    include: {
      patient: true,
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
          specialty: true,
          licenseNumber: true,
        }
      },
      medicalNote: true
    }
  })

  if (!appointment) {
    notFound()
  }

  const canStartConsultation = appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/appointments">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalles de la Cita</h1>
          <p className="text-muted-foreground">
            Información completa de la cita
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información de la Cita
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estado</span>
              <StatusChangeButton appointmentId={id} currentStatus={appointment.status} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-medium">
                {format(new Date(appointment.startTime), 'dd MMMM yyyy', { locale: es })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Hora</span>
              <span className="font-medium">
                {format(new Date(appointment.startTime), 'HH:mm')} - {format(new Date(appointment.endTime), 'HH:mm')}
              </span>
            </div>
            {appointment.reason && (
              <div>
                <span className="text-muted-foreground block">Motivo</span>
                <span>{appointment.reason}</span>
              </div>
            )}
            {appointment.notes && (
              <div>
                <span className="text-muted-foreground block">Notas</span>
                <span>{appointment.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-muted-foreground block">Nombre</span>
              <span className="font-medium text-lg">
                {appointment.patient.firstName} {appointment.patient.middleName || ''} {appointment.patient.lastName}
              </span>
            </div>
            {appointment.patient.phone && (
              <div>
                <span className="text-muted-foreground block">Teléfono</span>
                <span>{appointment.patient.phone}</span>
              </div>
            )}
            {appointment.patient.email && (
              <div>
                <span className="text-muted-foreground block">Email</span>
                <span>{appointment.patient.email}</span>
              </div>
            )}
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/patients/${appointment.patientId}`}>
                Ver Expediente
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Doctor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-muted-foreground block">Nombre</span>
              <span className="font-medium text-lg">Dr. {appointment.doctor.name}</span>
            </div>
            {appointment.doctor.specialty && (
              <div>
                <span className="text-muted-foreground block">Especialidad</span>
                <span>{appointment.doctor.specialty}</span>
              </div>
            )}
            {appointment.doctor.licenseNumber && (
              <div>
                <span className="text-muted-foreground block">Cédula</span>
                <span>{appointment.doctor.licenseNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Nota Médica
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointment.medicalNote ? (
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground block">Diagnóstico</span>
                  <span>{appointment.medicalNote.diagnosis}</span>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/patients/${appointment.patientId}/notes/${appointment.medicalNote.id}`}>
                    Ver Nota Completa
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No hay nota médica registrada</p>
                {canStartConsultation && (
                  <Button asChild>
                    <Link href={`/patients/${appointment.patientId}/notes/new?appointmentId=${appointment.id}`}>
                      Iniciar Consulta
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
