import Link from 'next/link'
import { 
  Calendar, 
  FileText, 
  FlaskConical, 
  Receipt, 
  History, 
  User,
  Mail,
  LogOut
} from 'lucide-react'

const portalNavItems = [
  { href: '/patient-portal', label: 'Inicio', icon: User },
  { href: '/patient-portal/citas', label: 'Mis Citas', icon: Calendar },
  { href: '/patient-portal/recetas', label: 'Mis Recetas', icon: FileText },
  { href: '/patient-portal/resultados', label: 'Mis Resultados', icon: FlaskConical },
  { href: '/patient-portal/facturas', label: 'Mis Facturas', icon: Receipt },
  { href: '/patient-portal/historial', label: 'Mi Historial', icon: History },
]

interface PortalNavProps {
  patientName: string
}

export function PortalNav({ patientName }: PortalNavProps) {
  return (
    <nav className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 hidden md:block">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-primary">HC Gestor</h2>
        <p className="text-sm text-muted-foreground">Portal del Paciente</p>
      </div>

      <div className="mb-4 p-3 bg-muted rounded-lg">
        <p className="font-medium text-sm">{patientName}</p>
      </div>

      <ul className="space-y-1">
        {portalNavItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray- text-sm font-medium100 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 pt-6 border-t">
        <Link
          href="/patient-portal/contacto"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Mail className="h-4 w-4" />
          Contactar
        </Link>
        <Link
          href="/patient-portal/perfil"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <User className="h-4 w-4" />
          Mi Perfil
        </Link>
        <form action="/api/portal/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </form>
      </div>
    </nav>
  )
}

export function MobilePortalNav() {
  return (
    <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 p-2">
      <ul className="flex justify-around">
        {portalNavItems.slice(0, 5).map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex flex-col items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label.split(' ')[1]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
