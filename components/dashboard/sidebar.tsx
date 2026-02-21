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
  ImageIcon,
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
  { name: 'Servicios', href: '/services', icon: Package },
  { name: 'Laboratorio', href: '/lab-orders', icon: FlaskConical },
  { name: 'Imagenología', href: '/imaging-orders', icon: ImageIcon },
  { name: 'Reportes', href: '/reports', icon: FileText },
  { name: 'Configuración', href: '/settings', icon: Settings },
]

interface SidebarProps {
  user: {
    name: string
    email: string
  }
}

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div data-tour="sidebar" className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col lg:p-4">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar backdrop-blur-xl px-6 pb-4 border border-sidebar-border rounded-2xl shadow-soft-elevated">
        <div className="flex h-16 shrink-0 items-center">
          <h1 className="text-xl font-serif font-bold text-primary tracking-tight">HC Gestor</h1>
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      data-tour={
                        item.href === '/dashboard' ? 'dashboard-stats' :
                        item.href === '/patients' ? 'patients' :
                        item.href === '/appointments' ? 'appointments' :
                        item.href === '/consultations' ? 'medical-notes' :
                        item.href === '/billing' ? 'billing' :
                        item.href === '/settings' ? 'settings' :
                        item.href === '/reports' ? 'reports' :
                        undefined
                      }
                      className={cn(
                        pathname === item.href
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-primary',
                        'group flex gap-x-3 rounded-xl p-2 text-sm font-medium transition-all duration-200'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            <li className="mt-auto">
              <div className="flex items-center justify-between gap-x-4 px-2 py-4 border-t border-sidebar-border/50">
                <ModeToggle />
                <div className="flex items-center gap-x-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate max-w-[100px]">{user.email}</span>
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
