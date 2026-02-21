import { getPortalSession } from '@/lib/portal/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, 
  FileText, 
  FlaskConical, 
  Receipt, 
  Clock,
  Plus
} from 'lucide-react'

export default async function PortalDashboard() {
  const session = await getPortalSession()

  if (!session) {
    return null
  }

  const [upcomingAppointments, pendingRequests, recentPrescriptions, pendingInvoices] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        patientId: session.patientId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        startTime: { gte: new Date() }
      },
      orderBy: { startTime: 'asc' },
      take: 3,
      include: {
        doctor: { select: { name: true } }
      }
    }),
    prisma.appointmentRequest.findMany({
      where: {
        patientId: session.patientId,
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.prescription.findMany({
      where: { patientId: session.patientId },
      orderBy: { issueDate: 'desc' },
      take: 3,
      include: {
        doctor: { select: { name: true } }
      }
    }),
    prisma.invoice.findMany({
      where: { 
        patientId: session.patientId,
        status: { in: ['PENDING', 'PARTIAL'] }
      },
      orderBy: { issueDate: 'desc' },
      take: 3
    })
  ])

  const hasPendingResults = await prisma.labOrder.count({
    where: {
      patientId: session.patientId,
      status: 'COMPLETED',
      resultRelease: null
    }
  }) + await prisma.imagingOrder.count({
    where: {
      patientId: session.patientId,
      status: 'COMPLETED',
      resultRelease: null
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bienvenido, {session.patientName.split(' ')[0]}</h1>
          <p className="text-muted-foreground">Aquí está tu información médica</p>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              <span>Tienes {pendingRequests.length} solicitud(es) de cita pendientes de aprobación</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Próxima Cita</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-2">
                <p className="font-medium">
                  {new Date(upcomingAppointments[0].startTime).toLocaleDateString('es-MX', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(upcomingAppointments[0].startTime).toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-sm">Dr. {upcomingAppointments[0].doctor.name}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No hay citas próximas</p>
            )}
            <Link href="/portal/citas">
              <Button variant="outline" size="sm" className="mt-4 w-full">
                Ver todas las citas
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recetas</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recentPrescriptions.length}</p>
            <p className="text-sm text-muted-foreground">recetas recientes</p>
            <Link href="/portal/recetas">
              <Button variant="outline" size="sm" className="mt-4 w-full">
                Ver recetas
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Facturas</CardTitle>
            <Receipt className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingInvoices.length}</p>
            <p className="text-sm text-muted-foreground">pendientes</p>
            <Link href="/portal/facturas">
              <Button variant="outline" size="sm" className="mt-4 w-full">
                Ver facturas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hasPendingResults > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-800">
                  <FlaskConical className="h-5 w-5" />
                  <span>Tienes {hasPendingResults} resultado(s) nuevo(s)</span>
                </div>
                <Link href="/portal/resultados">
                  <Button variant="outline" size="sm">Ver</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-4">
            <Link href="/portal/citas/agendar">
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Solicitar Nueva Cita
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Accesos Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/portal/historial">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
                <FileText className="h-5 w-5" />
                <span className="text-xs">Mi Historial</span>
              </Button>
            </Link>
            <Link href="/portal/resultados">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
                <FlaskConical className="h-5 w-5" />
                <span className="text-xs">Resultados</span>
              </Button>
            </Link>
            <Link href="/portal/perfil">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
                <Calendar className="h-5 w-5" />
                <span className="text-xs">Mi Perfil</span>
              </Button>
            </Link>
            <Link href="/portal/contacto">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-1">
                <Receipt className="h-5 w-5" />
                <span className="text-xs">Contactar</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
