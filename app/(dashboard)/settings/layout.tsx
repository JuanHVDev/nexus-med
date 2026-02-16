'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, 
  Users, 
  UserCog, 
  Clock, 
} from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsNavigation = [
  { name: 'Clínica', href: '/settings/clinic', icon: Building2 },
  { name: 'Usuarios', href: '/settings/users', icon: Users },
  { name: 'Médicos', href: '/settings/doctors', icon: UserCog },
  { name: 'Horarios', href: '/settings/hours', icon: Clock },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Administra la configuración de tu clínica
        </p>
      </div>

      <div className="flex space-x-2 border-b">
        {settingsNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
