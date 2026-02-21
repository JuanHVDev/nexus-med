import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowRight,
} from 'lucide-react'
import { MotionItem } from '@/components/ui/motion-container'
import { getDashboardStats } from '@/lib/dashboard-stats'
import { getUserClinicId } from '@/lib/clinic'
import { getSession } from '@/lib/auth-helpers'

async function StatsData() {
  const session = await getSession()
  if (!session) return null
  
  const clinicId = await getUserClinicId(session.user.id)
  if (!clinicId) return null
  
  const stats = await getDashboardStats(clinicId)
  const productivity = stats.appointmentsToday > 0
    ? Math.round((stats.totalMedicalNotes / stats.appointmentsToday) * 100)
    : 100

  return { stats, productivity }
}

export async function StatsCards() {
  const data = await StatsData()
  
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">No tienes una clínica asignada</p>
        <Link href="/register" className="text-primary hover:underline">
          Crear mi clínica
        </Link>
      </div>
    )
  }

  const { stats, productivity } = data

  return (
    <>
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
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700" />
        </Card>
      </MotionItem>

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
    </>
  )
}

export function StatsCardsSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div 
          key={i} 
          className={`${i === 1 ? 'md:col-span-2 md:row-span-2' : ''} ${i === 7 ? 'md:col-span-2' : ''}`}
        >
          <Card className="h-full border-none bg-muted/50 animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted-foreground/20 rounded w-20 mb-4" />
              <div className="h-8 bg-muted-foreground/20 rounded w-16" />
            </CardContent>
          </Card>
        </div>
      ))}
    </>
  )
}
