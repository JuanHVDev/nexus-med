import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-helpers'
import { MotionContainer, StaggerChildren } from '@/components/ui/motion-container'
import { StatsCards, StatsCardsSkeleton } from './_components/stats-cards'
import { QuickActions } from './_components/quick-actions'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

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

      <StaggerChildren data-tour="dashboard-stats" className="grid grid-cols-1 md:grid-cols-4 auto-rows-[160px] gap-4">
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>
        <QuickActions />
      </StaggerChildren>
    </div>
  )
}
