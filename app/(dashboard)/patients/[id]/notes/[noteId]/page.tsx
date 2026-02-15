import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Stethoscope, FileText, Activity, Pencil } from "lucide-react"
import { specialtyLabels } from "@/lib/validations/medical-note"

interface PageProps {
  params: Promise<{ id: string; noteId: string }>
}

export default async function MedicalNoteDetailPage({ params }: PageProps) {
  const { id, noteId } = await params
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session) {
    return <div>No autorizado</div>
  }

  const note = await prisma.medicalNote.findFirst({
    where: {
      id: BigInt(noteId),
      patientId: BigInt(id),
      clinicId: session.user.clinicId
    },
    include: {
      patient: true,
      doctor: {
        select: {
          id: true,
          name: true,
          specialty: true,
          licenseNumber: true,
        }
      }
    }
  })

  if (!note) {
    notFound()
  }

  const vitalSigns = note.vitalSigns 
    ? typeof note.vitalSigns === 'string' 
      ? JSON.parse(note.vitalSigns) 
      : JSON.parse(JSON.stringify(note.vitalSigns))
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/patients/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Nota Médica</h1>
          <p className="text-muted-foreground">
            Fecha: {format(new Date(note.createdAt), 'dd MMMM yyyy HH:mm', { locale: es })}
          </p>
        </div>
        <Button asChild>
          <Link href={`/patients/${id}/notes/${noteId}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar Nota
          </Link>
        </Button>
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
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/patients/${id}`}>
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

        {vitalSigns && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Signos Vitales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {vitalSigns.bloodPressureSystolic && (
                  <div>
                    <span className="text-muted-foreground block text-sm">PA</span>
                    <span className="font-medium">{vitalSigns.bloodPressureSystolic}/{vitalSigns.bloodPressureDiastolic} mmHg</span>
                  </div>
                )}
                {vitalSigns.heartRate && (
                  <div>
                    <span className="text-muted-foreground block text-sm">FC</span>
                    <span className="font-medium">{vitalSigns.heartRate} lpm</span>
                  </div>
                )}
                {vitalSigns.temperature && (
                  <div>
                    <span className="text-muted-foreground block text-sm">Temperatura</span>
                    <span className="font-medium">{vitalSigns.temperature} °C</span>
                  </div>
                )}
                {vitalSigns.oxygenSaturation && (
                  <div>
                    <span className="text-muted-foreground block text-sm">SpO2</span>
                    <span className="font-medium">{vitalSigns.oxygenSaturation}%</span>
                  </div>
                )}
                {vitalSigns.weight && (
                  <div>
                    <span className="text-muted-foreground block text-sm">Peso</span>
                    <span className="font-medium">{vitalSigns.weight} kg</span>
                  </div>
                )}
                {vitalSigns.height && (
                  <div>
                    <span className="text-muted-foreground block text-sm">Altura</span>
                    <span className="font-medium">{vitalSigns.height} cm</span>
                  </div>
                )}
                {vitalSigns.respiratoryRate && (
                  <div>
                    <span className="text-muted-foreground block text-sm">FR</span>
                    <span className="font-medium">{vitalSigns.respiratoryRate} rpm</span>
                  </div>
                )}
              </div>
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
