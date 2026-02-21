import { getPortalSession } from '@/lib/portal/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Calendar, Shield } from 'lucide-react'

export default async function PortalPerfilPage() {
  const session = await getPortalSession()

  if (!session) return null

  const patient = await prisma.patient.findUnique({
    where: { id: session.patientId },
    include: {
      clinic: { select: { name: true, rfc: true, address: true, phone: true, email: true } },
      user: { select: { email: true, createdAt: true } }
    }
  })

  if (!patient) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">Información de tu cuenta</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Datos Personales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {patient.firstName[0]}{patient.lastName[0]}
                </span>
              </div>
              <div>
                <p className="text-xl font-bold">{patient.firstName} {patient.lastName}</p>
                <p className="text-muted-foreground">Paciente</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                <p className="font-medium">{new Date(patient.birthDate).toLocaleDateString('es-MX')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Género</p>
                <p className="font-medium">{patient.gender === 'MALE' ? 'Masculino' : patient.gender === 'FEMALE' ? 'Femenino' : 'Otro'}</p>
              </div>
              {patient.curp && (
                <div>
                  <p className="text-sm text-muted-foreground">CURP</p>
                  <p className="font-medium">{patient.curp}</p>
                </div>
              )}
              {patient.bloodType && (
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Sangre</p>
                  <p className="font-medium">{patient.bloodType.replace('_', ' ')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Información de Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Email de Cuenta</p>
              <p className="font-medium">{patient.user?.email}</p>
            </div>
            {patient.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email Personal</p>
                <p className="font-medium">{patient.email}</p>
              </div>
            )}
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
            {(patient.address || patient.city) && (
              <div>
                <p className="text-sm text-muted-foreground">Dirección</p>
                <p className="font-medium">
                  {[patient.address, patient.city, patient.state].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información de la Clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Clínica</p>
              <p className="font-medium">{patient.clinic.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">RFC</p>
              <p className="font-medium">{patient.clinic.rfc}</p>
            </div>
            {patient.clinic.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Teléfono de la Clínica</p>
                <p className="font-medium">{patient.clinic.phone}</p>
              </div>
            )}
            {patient.clinic.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email de la Clínica</p>
                <p className="font-medium">{patient.clinic.email}</p>
              </div>
            )}
            {patient.clinic.address && (
              <div>
                <p className="text-sm text-muted-foreground">Dirección de la Clínica</p>
                <p className="font-medium">{patient.clinic.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Cuenta creada</p>
              <p className="font-medium">
                {patient.user?.createdAt 
                  ? new Date(patient.user.createdAt).toLocaleDateString('es-MX')
                  : 'No disponible'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última actualización</p>
              <p className="font-medium">
                {new Date(patient.updatedAt).toLocaleDateString('es-MX')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className="font-medium text-green-600">Activa</p>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Para cambiar tu contraseña, contacta a tu clínica.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
