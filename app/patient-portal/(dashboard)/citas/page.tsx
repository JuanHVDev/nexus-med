import { getPortalSession } from '@/lib/portal/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Plus } from 'lucide-react'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  SCHEDULED: { label: 'Programada', variant: 'default' },
  CONFIRMED: { label: 'Confirmada', variant: 'secondary' },
  IN_PROGRESS: { label: 'En Progreso', variant: 'secondary' },
  COMPLETED: { label: 'Completada', variant: 'outline' },
  CANCELLED: { label: 'Cancelada', variant: 'destructive' },
  NO_SHOW: { label: 'No Asistió', variant: 'destructive' },
}

export default async function PortalCitasPage() {
  const session = await getPortalSession()

  if (!session) return null

  const [appointments, pendingRequests] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId: session.patientId },
      orderBy: { startTime: 'desc' },
      include: {
        doctor: { select: { name: true, specialty: true } }
      }
    }),
    prisma.appointmentRequest.findMany({
      where: { patientId: session.patientId },
      orderBy: { createdAt: 'desc' }
    })
  ])

  const upcoming = appointments.filter(a => 
    ['SCHEDULED', 'CONFIRMED'].includes(a.status) && new Date(a.startTime) >= new Date()
  )
  const past = appointments.filter(a => 
    a.status === 'COMPLETED' || new Date(a.startTime) < new Date()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis Citas</h1>
          <p className="text-muted-foreground">Historial y próximas citas</p>
        </div>
        <Link href="/patient-portal/citas/agendar">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Solicitar Cita
          </Button>
        </Link>
      </div>

      {pendingRequests.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-yellow-800">Solicitudes Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">
                        {new Date(request.requestedDate).toLocaleDateString('es-MX', {
                          weekday: 'long', day: 'numeric', month: 'long'
                        })}
                      </p>
                      {request.reason && <p className="text-sm text-muted-foreground">{request.reason}</p>}
                    </div>
                  </div>
                  <Badge variant="secondary">Pendiente</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Próximas Citas</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map(appointment => (
                <div key={appointment.id} className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg text-center min-w-[80px]">
                      <p className="text-xs text-muted-foreground">
                        {new Date(appointment.startTime).toLocaleDateString('es-MX', { month: 'short' })}
                      </p>
                      <p className="text-xl font-bold">
                        {new Date(appointment.startTime).getDate()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {new Date(appointment.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Dr. {appointment.doctor.name}
                      </p>
                      {appointment.reason && (
                        <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={statusLabels[appointment.status]?.variant || 'outline'}>
                    {statusLabels[appointment.status]?.label || appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No hay citas próximas</p>
          )}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Citas Pasadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {past.slice(0, 10).map(appointment => (
                <div key={appointment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">
                      {new Date(appointment.startTime).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">Dr. {appointment.doctor.name}</p>
                  </div>
                  <Badge variant={statusLabels[appointment.status]?.variant || 'outline'}>
                    {statusLabels[appointment.status]?.label || appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
