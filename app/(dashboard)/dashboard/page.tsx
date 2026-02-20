import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getUserClinicId } from '@/lib/clinic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { StaggerChildren, MotionItem, MotionContainer } from '@/components/ui/motion-container'

async function getDashboardStats(clinicId: bigint) {
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
    prisma.patient.count({
      where: { clinicId, isActive: true }
    }),
    prisma.appointment.count({
      where: {
        clinicId,
        startTime: {
          gte: today,
          lt: tomorrow
        }
      }
    }),
    prisma.medicalNote.count({
      where: { clinicId }
    }),
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
    prisma.appointment.count({
      where: {
        clinicId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        startTime: { gte: today }
      }
    })
  ])

  return {
    totalPatients,
    appointmentsToday,
    totalMedicalNotes,
    monthlyRevenue: monthlyRevenue._sum.total || 0,
    pendingAppointments
  }
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No autorizado</p>
      </div>
    )
  }

  const clinicId = await getUserClinicId(session.user.id)

  if (!clinicId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">No tienes una clínica asignada</p>
        <Link href="/register" className="text-primary hover:underline">
          Crear mi clínica
        </Link>
      </div>
    )
  }

  const stats = await getDashboardStats(clinicId)

  const productivity = stats.appointmentsToday > 0
    ? Math.round((stats.totalMedicalNotes / stats.appointmentsToday) * 100)
    : 100

  return (
    <div className="space-y-8 pb-10">
      <MotionContainer>
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-serif text-primary tracking-tight">Resumen Clínico</h1>
          <p className="text-muted-foreground font-sans">
            Bienvenido, <span className="text-foreground font-medium">{session.user.name}</span>. 
            Aquí está el estado de tu práctica hoy.
          </p>
        </div>
      </MotionContainer>

      <StaggerChildren className="grid grid-cols-1 md:grid-cols-4 auto-rows-[160px] gap-4">
        {/* Row 1 & 2: Main Priority - Appointments Today */}
        <MotionItem className="md:col-span-2 md:row-span-2">
          <Card className="h-full border-none bg-primary text-primary-foreground shadow-soft-elevated overflow-hidden group">
            <CardHeader className="relative z-10">
              <CardTitle className="text-lg font-serif opacity-90 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Citas para Hoy
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 flex flex-col justify-between h-[calc(100%-80px)]">
              <div className="text-7xl font-mono font-bold tracking-tighter">
                {stats.appointmentsToday}
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm opacity-80 font-sans max-w-[150px]">
                  Pacientes programados para atención inmediata.
                </p>
                <Link 
                  href="/appointments" 
                  className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors group-hover:translate-x-1"
                >
                  <ArrowRight className="h-6 w-6" />
                </Link>
              </div>
            </CardContent>
            {/* Decorative background element */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700" />
          </Card>
        </MotionItem>

        {/* Citas Pendientes */}
        <MotionItem>
          <Card className="h-full border-none shadow-soft-elevated bg-card/40 backdrop-blur-md hover:bg-card/60 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-sans uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Activity className="h-3 w-3" />
                Próximas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-primary">{stats.pendingAppointments}</div>
              <p className="text-[10px] text-muted-foreground mt-1 font-sans">
                Citas pendientes de atención
              </p>
            </CardContent>
          </Card>
        </MotionItem>

        {/* Productivity */}
        <MotionItem>
          <Card className="h-full border-none shadow-soft-elevated bg-card/40 backdrop-blur-md hover:bg-card/60 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-sans uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                Eficiencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-accent-foreground">{productivity}%</div>
              <p className="text-[10px] text-muted-foreground mt-1 font-sans">
                Conversión de citas a notas
              </p>
            </CardContent>
          </Card>
        </MotionItem>

        {/* Total Patients */}
        <MotionItem>
          <Card className="h-full border-none shadow-soft-elevated bg-card/40 backdrop-blur-md hover:bg-card/60 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-sans uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Users className="h-3 w-3" />
                Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-foreground">{stats.totalPatients}</div>
              <p className="text-[10px] text-muted-foreground mt-1 font-sans">
                Pacientes activos registrados
              </p>
            </CardContent>
          </Card>
        </MotionItem>

        {/* Medical Notes */}
        <MotionItem>
          <Card className="h-full border-none shadow-soft-elevated bg-card/40 backdrop-blur-md hover:bg-card/60 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-sans uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Registros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-foreground">{stats.totalMedicalNotes}</div>
              <p className="text-[10px] text-muted-foreground mt-1 font-sans">
                Notas médicas totales
              </p>
            </CardContent>
          </Card>
        </MotionItem>

        {/* Row 3: Monthly Revenue */}
        <MotionItem className="md:col-span-2">
          <Card className="h-full border-none shadow-soft-elevated bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-serif flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Ingresos del Mes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div>
                <div className="text-4xl font-mono font-bold">
                  ${Number(stats.monthlyRevenue).toLocaleString('es-MX')}
                </div>
                <p className="text-xs opacity-70 mt-1 font-sans">
                  Facturación total acumulada este mes
                </p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-20" />
            </CardContent>
          </Card>
        </MotionItem>

        {/* Quick Actions */}
        <MotionItem className="md:col-span-2">
          <Card className="h-full border-none shadow-soft-elevated bg-muted/50 backdrop-blur-md border border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-serif">Acciones de Control</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link
                href="/patients/new"
                className="flex items-center justify-center gap-2 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 py-3 rounded-xl transition-all font-sans text-sm font-medium hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 text-primary" />
                Paciente
              </Link>
              <Link
                href="/appointments/new"
                className="flex items-center justify-center gap-2 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 py-3 rounded-xl transition-all font-sans text-sm font-medium hover:scale-[1.02] active:scale-[0.98]"
              >
                <Calendar className="h-4 w-4 text-primary" />
                Nueva Cita
              </Link>
            </CardContent>
          </Card>
        </MotionItem>
      </StaggerChildren>
    </div>
  )
}
