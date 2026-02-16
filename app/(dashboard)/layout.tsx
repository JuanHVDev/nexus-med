import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
})
{
  const session = await auth.api.getSession({
    headers: await headers(),
  })
if (!session)
  {
    redirect('/login')
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar user={session.user} />
      <div className="lg:pl-64">
        <DashboardHeader user={session.user} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}