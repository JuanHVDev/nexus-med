import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { OnboardingTour } from '@/components/onboarding/onboarding-tour'
import { HelpButton } from '@/components/onboarding/help-button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/login')
  }

  const userRole = (session.user as unknown as { role?: string }).role || 'DOCTOR'

  return (
    <div className="min-h-screen bg-background grain">
      <OnboardingTour userRole={userRole} />
      <HelpButton />
      <DashboardSidebar user={session.user} />
      <div className="lg:pl-72 transition-all duration-300">
        <DashboardHeader user={session.user} />
        <main className="p-6 lg:p-8 animate-fade-up">
          {children}
        </main>
      </div>
    </div>
  )
}
