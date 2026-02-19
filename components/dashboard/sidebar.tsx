'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  Stethoscope,
  Pill,
  CreditCard,
  Package,
  FlaskConical,
  ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModeToggle } from '@/components/mode-toggle'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pacientes', href: '/patients', icon: Users },
  { name: 'Citas', href: '/appointments', icon: Calendar },
  { name: 'Consultas', href: '/consultations', icon: Stethoscope },
  { name: 'Recetas', href: '/prescriptions', icon: Pill },
  { name: 'Facturación', href: '/billing', icon: CreditCard },
  { name: 'Laboratorio', href: '/lab-orders', icon: FlaskConical },
  { name: 'Imagenología', href: '/imaging-orders', icon: ImageIcon },
  { name: 'Reportes', href: '/reports', icon: FileText },
  { name: 'Configuración', href: '/settings', icon: Settings },
]

const adminNavigation = [
  { name: 'Servicios', href: '/services', icon: Package },
]

interface SidebarProps
{
  user: {
    name: string
    email: string
    role: string
  }
}
export function DashboardSidebar({ user }: SidebarProps)
{
  const pathname = usePathname()
  const isAdmin = user.role === 'ADMIN'
  
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r">
        <div className="flex h-16 shrink-0 items-center">
          <h1 className="text-xl font-bold text-slate-900">HC Gestor</h1>
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        pathname === item.href
                          ? 'bg-slate-50 text-primary'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-primary',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                      )}
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                ))}
                {isAdmin && (
                  <>
                    <li className="pt-4 pb-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
                        Administración
                      </span>
                    </li>
                    {adminNavigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            pathname === item.href
                              ? 'bg-slate-50 text-primary'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-primary',
                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                          )}
                        >
                          <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </li>

            <li className="mt-auto">
              <div className="flex items-center justify-between gap-x-4 px-2 py-3">
                <ModeToggle />
                <div className="flex items-center gap-x-4">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">{user.role}</span>
                    <span className="text-sm truncate">{user.email}</span>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
