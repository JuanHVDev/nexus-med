import { getPortalSession } from '@/lib/portal/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FlaskConical, Image, Eye, FileText } from 'lucide-react'

export default async function PortalResultadosPage() {
  const session = await getPortalSession()

  if (!session) return null

  const [labOrders, imagingOrders] = await Promise.all([
    prisma.labOrder.findMany({
      where: { 
        patientId: session.patientId,
        status: 'COMPLETED',
        resultRelease: { isNot: null }
      },
      orderBy: { orderDate: 'desc' },
      include: {
        doctor: { select: { name: true } },
        results: true,
        resultRelease: true
      }
    }),
    prisma.imagingOrder.findMany({
      where: { 
        patientId: session.patientId,
        status: 'COMPLETED',
        resultRelease: { isNot: null }
      },
      orderBy: { orderDate: 'desc' },
      include: {
        doctor: { select: { name: true } },
        resultRelease: true
      }
    })
  ])

  const pendingLabResults = await prisma.labOrder.count({
    where: {
      patientId: session.patientId,
      status: 'COMPLETED',
      resultRelease: null
    }
  })

  const pendingImagingResults = await prisma.imagingOrder.count({
    where: {
      patientId: session.patientId,
      status: 'COMPLETED',
      resultRelease: null
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis Resultados</h1>
        <p className="text-muted-foreground">Resultados de laboratorios e imágenes</p>
      </div>

      {(pendingLabResults > 0 || pendingImagingResults > 0) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 text-blue-800">
              <FileText className="h-5 w-5" />
              <div>
                <p className="font-medium">Resultados pendientes de liberación</p>
                <p className="text-sm">
                  {pendingLabResults > 0 && `${pendingLabResults} resultado(s) de laboratorio`}
                  {pendingLabResults > 0 && pendingImagingResults > 0 && ' y '}
                  {pendingImagingResults > 0 && `${pendingImagingResults} resultado(s) de imágenes`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Resultados de Laboratorio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {labOrders.length > 0 ? (
            <div className="space-y-3">
              {labOrders.map(order => {
                const tests = order.tests as Array<{ name: string; code?: string }>
                return (
                  <div key={order.id} className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {new Date(order.orderDate).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tests.map(t => t.name).join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">Dr. {order.doctor.name}</p>
                    </div>
                    <div className="flex gap-2">
                      {order.resultsFileUrl && (
                        <a href={order.resultsFileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No hay resultados de laboratorio</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Image alt="" className="h-5 w-5" />
            Resultados de Imágenes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {imagingOrders.length > 0 ? (
            <div className="space-y-3">
              {imagingOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                  <div>
                    <p className="font-medium">{order.studyType} - {order.bodyPart}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.orderDate).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">Dr. {order.doctor.name}</p>
                    {order.findings && (
                      <p className="text-sm mt-1">{order.findings.substring(0, 100)}...</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {order.reportUrl && (
                      <a href={order.reportUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Reporte
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No hay resultados de imágenes</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
