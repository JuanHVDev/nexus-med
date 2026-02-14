import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Edit, ArrowLeft, Phone, Mail, Calendar } from 'lucide-react'
export default async function PatientDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) throw new Error('Unauthorized')
  const { id } = await params

  const patient = await prisma.patient.findFirst({
    where: { id: BigInt(id), clinicId: session.user.clinicId },
    include: {
      medicalHistory: true,
      emergencyContacts: true,
      _count: { select: { appointments: true, medicalNotes: true } }
    }
  })
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
        <Link href={`/patients/${patient.id}/edit`}>
          <Button><Edit className="h-4 w-4 mr-2" /> Editar</Button>
        </Link>
      </div>
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
          <CardHeader><CardTitle className="text-lg">Estadísticas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{patient._count.appointments} citas</span>
            </div>
            <div><p className="text-sm text-muted-foreground">Consultas</p><p className="font-medium">{patient._count.medicalNotes}</p></div>
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
      {/* Contactos de Emergencia */}
      {patient.emergencyContacts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Contactos de Emergencia</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patient.emergencyContacts.map(contact => (
                <div key={contact.id} className="p-4 border rounded-lg">
                  <p className="font-medium">{contact.name}</p>
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