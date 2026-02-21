'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, UserCog, Clock, UserCircle, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsSections = [
  {
    title: 'Clínica',
    description: 'Información y configuración de tu clínica',
    href: '/settings/clinic',
    icon: Building2,
  },
  {
    title: 'Equipo',
    description: 'Gestiona los miembros de tu clínica',
    href: '/settings/team',
    icon: Users,
  },
  {
    title: 'Médicos',
    description: 'Información profesional de los médicos',
    href: '/settings/doctors',
    icon: UserCog,
  },
  {
    title: 'Horarios',
    description: 'Horarios de atención de la clínica',
    href: '/settings/hours',
    icon: Clock,
  },
  {
    title: 'Pacientes Portal',
    description: 'Aprobar registros de pacientes',
    href: '/settings/portal-patients',
    icon: UserCircle,
  },
  {
    title: 'Liberar Resultados',
    description: 'Liberar resultados al portal del paciente',
    href: '/settings/portal-results',
    icon: FlaskConical,
  },
]

export default function SettingsPage() {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Configuración</h2>
        <p className="text-sm text-muted-foreground">
          Gestiona la configuración de tu clínica y cuenta
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className={cn(
              "hover:bg-accent/50 transition-colors cursor-pointer h-full",
              pathname === section.href && "border-primary"
            )}>
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <CardDescription className="text-sm">{section.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
