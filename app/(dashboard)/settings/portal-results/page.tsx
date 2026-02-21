import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FlaskConical, ImageIcon, Eye, Check } from 'lucide-react'

export default async function PortalResultsPage() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user) {
    redirect('/login')
  }

  const [pendingLabResults, pendingImagingResults] = await Promise.all([
    prisma.labOrder.findMany({
      where: {
        status: 'COMPLETED',
        resultRelease: null,
        resultsFileUrl: { not: null }
      },
      orderBy: { orderDate: 'desc' },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        doctor: { select: { name: true } }
      }
    }),
    prisma.imagingOrder.findMany({
      where: {
        status: 'COMPLETED',
        resultRelease: null,
        reportUrl: { not: null }
      },
      orderBy: { orderDate: 'desc' },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        doctor: { select: { name: true } }
      }
    })
  ])

  const totalPending = pendingLabResults.length + pendingImagingResults.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Liberar Resultados</h1>
        <p className="text-muted-foreground">Libera resultados para el portal del paciente</p>
      </div>

      {totalPending === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-muted-foreground">No hay resultados pendientes de liberar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Laboratorio ({pendingLabResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingLabResults.length > 0 ? (
                <div className="space-y-3">
                  {pendingLabResults.map(order => (
                    <div key={order.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {order.patient.firstName} {order.patient.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.orderDate).toLocaleDateString('es-MX')} - Dr. {order.doctor.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {order.resultsFileUrl && (
                          <a href={order.resultsFileUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </a>
                        )}
                        <form action={`/api/portal/results/${order.id}/release?type=lab`} method="POST">
                          <Button size="sm">
                            <Check className="h-4 w-4 mr-1" />
                            Liberar
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No hay resultados pendientes</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Imagenología ({pendingImagingResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingImagingResults.length > 0 ? (
                <div className="space-y-3">
                  {pendingImagingResults.map(order => (
                    <div key={order.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {order.patient.firstName} {order.patient.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.studyType} - {order.bodyPart} - Dr. {order.doctor.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {order.reportUrl && (
                          <a href={order.reportUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </a>
                        )}
                        <form action={`/api/portal/results/${order.id}/release?type=imaging`} method="POST">
                          <Button size="sm">
                            <Check className="h-4 w-4 mr-1" />
                            Liberar
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No hay resultados pendientes</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
