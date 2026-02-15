import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import
{
  Users,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react'
async function getDashboardStats(userId: string, clinicId: number)
{
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const [
    totalPatients,
    appointmentsToday,
    totalMedicalNotes,
    monthlyRevenue,
    pendingAppointments
  ] = await Promise.all([
    // Total pacientes
    prisma.patient.count({
      where: { clinicId, isActive: true }
    }),

    // Citas hoy
    prisma.appointment.count({
      where: {
        clinicId,
        startTime: {
          gte: today,
          lt: tomorrow
        }
      }
    }),

    // Total notas médicas
    prisma.medicalNote.count({
      where: { clinicId }
    }),

    // Ingresos del mes (calculado)
    prisma.invoice.aggregate({
      where: {
        clinicId,
        status: 'PAID',
        issueDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1)
        }
      },
      _sum: { total: true }
    }),

    // Citas pendientes
    prisma.appointment.count({
      where: {
        clinicId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        startTime: { gte: today }
      }
    })
  ])
  // Consultas por día (últimos 7 días)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const appointmentsLastWeek = await prisma.appointment.findMany({
    where: {
      clinicId,
      startTime: { gte: sevenDaysAgo }
    },
    select: { startTime: true }
  })
  // Agrupar en JavaScript
  const appointmentsByDay = appointmentsLastWeek.reduce((acc, apt) =>
  {
    const day = apt.startTime.toLocaleDateString('es-MX', { weekday: 'long' })
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  // Convertir a array para el UI
  const weeklyAppointments = Object.entries(appointmentsByDay).map(([day, count]) => ({
    day,
    count
  }))

  return {
    totalPatients,
    appointmentsToday,
    totalMedicalNotes,
    monthlyRevenue: monthlyRevenue._sum.total || 0,
    pendingAppointments,
    weeklyAppointments
  }
}
export default async function DashboardPage()
{
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user?.clinicId)
  {
    return <div>No tienes una clínica asignada</div>
  }
  const stats = await getDashboardStats(
    session.user.id,
    session.user.clinicId
  )
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido de vuelta, {session.user.name}
        </p>
      </div>
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              Activos en el sistema
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appointmentsToday}</div>
            <p className="text-xs text-muted-foreground">
              Programadas para hoy
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMedicalNotes}</div>
            <p className="text-xs text-muted-foreground">
              Total de notas médicas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(stats.monthlyRevenue).toLocaleString('es-MX')}
            </div>
            <p className="text-xs text-muted-foreground">
              Facturado este mes
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Additional Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Citas Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.pendingAppointments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por atender próximamente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Productividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.appointmentsToday > 0
                ? Math.round((stats.totalMedicalNotes / stats.appointmentsToday) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasa de consultas completadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/patients/new"
              className="block w-full text-center bg-primary text-white py-2 rounded-md hover:bg-primary/90"
            >
              + Nuevo Paciente
            </Link>
            <Link
              href="/appointments/new"
              className="block w-full text-center bg-secondary text-secondary-foreground py-2 rounded-md hover:bg-secondary/90"
            >
              + Nueva Cita
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}