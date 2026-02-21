import { getPortalSession } from '@/lib/portal/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Activity, Pill, AlertCircle, User, Phone } from 'lucide-react'

export default async function PortalHistorialPage() {
  const session = await getPortalSession()

  if (!session) return null

  const [patient, medicalHistory, recentNotes] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: session.patientId },
      include: {
        clinic: { select: { name: true } },
        emergencyContacts: true
      }
    }),
    prisma.medicalHistory.findUnique({
      where: { patientId: session.patientId }
    }),
    prisma.medicalNote.findMany({
      where: { patientId: session.patientId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        doctor: { select: { name: true, specialty: true } }
      }
    })
  ])

  if (!patient) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Historial Médico</h1>
        <p className="text-muted-foreground">Resumen de tu información médica</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{patient.firstName} {patient.lastName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                <p className="font-medium">{new Date(patient.birthDate).toLocaleDateString('es-MX')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Género</p>
                <p className="font-medium">{patient.gender}</p>
              </div>
            </div>
            {patient.bloodType && (
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Sangre</p>
                <p className="font-medium">{patient.bloodType.replace('_', ' ')}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Clínica</p>
              <p className="font-medium">{patient.clinic.name}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium">{patient.phone}</p>
              </div>
            )}
            {patient.mobile && (
              <div>
                <p className="text-sm text-muted-foreground">Celular</p>
                <p className="font-medium">{patient.mobile}</p>
              </div>
            )}
            {patient.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{patient.email}</p>
              </div>
            )}
            {patient.address && (
              <div>
                <p className="text-sm text-muted-foreground">Dirección</p>
                <p className="font-medium">{patient.address}, {patient.city}, {patient.state}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {medicalHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Historial Clínico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {medicalHistory.allergies.length > 0 && (
              <div>
                <p className="font-medium flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Alergias
                </p>
                <div className="flex flex-wrap gap-2">
                  {medicalHistory.allergies.map((allergy, idx) => (
                    <Badge key={idx} variant="destructive">{allergy}</Badge>
                  ))}
                </div>
              </div>
            )}

            {medicalHistory.currentMedications.length > 0 && (
              <div>
                <p className="font-medium flex items-center gap-2 mb-2">
                  <Pill className="h-4 w-4" />
                  Medicamentos Actuales
                </p>
                <div className="flex flex-wrap gap-2">
                  {medicalHistory.currentMedications.map((med, idx) => (
                    <Badge key={idx} variant="outline">{med}</Badge>
                  ))}
                </div>
              </div>
            )}

            {medicalHistory.chronicDiseases.length > 0 && (
              <div>
                <p className="font-medium mb-2">Enfermedades Crónicas</p>
                <div className="flex flex-wrap gap-2">
                  {medicalHistory.chronicDiseases.map((disease, idx) => (
                    <Badge key={idx} variant="secondary">{disease}</Badge>
                  ))}
                </div>
              </div>
            )}

            {medicalHistory.surgeries.length > 0 && (
              <div>
                <p className="font-medium mb-2">Cirugías</p>
                <div className="flex flex-wrap gap-2">
                  {medicalHistory.surgeries.map((surgery, idx) => (
                    <Badge key={idx} variant="outline">{surgery}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Fumador</p>
                <p className="font-medium">{medicalHistory.smoking ? 'Sí' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alcohol</p>
                <p className="font-medium">{medicalHistory.alcohol ? 'Sí' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Drogas</p>
                <p className="font-medium">{medicalHistory.drugs ? 'Sí' : 'No'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {patient.emergencyContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contactos de Emergencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patient.emergencyContacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.relation}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{contact.phone}</p>
                    {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recentNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notas Médicas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentNotes.map(note => (
                <div key={note.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{note.chiefComplaint}</p>
                    <Badge variant="outline">{note.specialty || 'General'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dr. {note.doctor.name} - {new Date(note.createdAt).toLocaleDateString('es-MX')}
                  </p>
                  <p className="text-sm mt-1">{note.diagnosis}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
