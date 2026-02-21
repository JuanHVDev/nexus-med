import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Check, Mail } from 'lucide-react'

export default async function PortalPatientsPage() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user) {
    redirect('/login')
  }

  const portalPatients = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    include: {
      patient: {
        include: {
          clinic: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const pendingApprovals = portalPatients.filter(p => !p.isActive)
  const activePatients = portalPatients.filter(p => p.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pacientes del Portal</h1>
          <p className="text-muted-foreground">Gestiona pacientes registrados en el portal</p>
        </div>
      </div>

      {pendingApprovals.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-800 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Aprobaciones Pendientes ({pendingApprovals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals.map(patient => (
                <div key={patient.id} className="flex items-center justify-between bg-white p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                      {patient.patient && (
                        <p className="text-xs text-muted-foreground">
                          Paciente: {patient.patient.firstName} {patient.patient.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <form action={`/api/portal/patients/${patient.id}/approve`} method="POST">
                      <Button size="sm" variant="outline" className="text-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pacientes Activos ({activePatients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activePatients.length > 0 ? (
            <div className="space-y-2">
              {activePatients.map(patient => (
                <div key={patient.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Activo</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No hay pacientes activos en el portal</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
