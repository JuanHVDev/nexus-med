import { redirect } from 'next/navigation'
import { getPortalSession } from '@/lib/portal/auth'
import { PortalNav } from '@/components/portal/portal-nav'
import { MobilePortalNav } from '@/components/portal/portal-nav'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getPortalSession()

  if (!session) {
    redirect('/patient-portal/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <PortalNav patientName={session.patientName} />
      <main className="flex-1 p-6 pb-20 md:pb-6 overflow-auto">
        {children}
      </main>
      <MobilePortalNav />
    </div>
  )
}
