import { getPortalSession } from '@/lib/portal/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, User } from 'lucide-react'

export default async function PortalRecetasPage() {
  const session = await getPortalSession()

  if (!session) return null

  const prescriptions = await prisma.prescription.findMany({
    where: { patientId: session.patientId },
    orderBy: { issueDate: 'desc' },
    include: {
      doctor: { select: { name: true, specialty: true, licenseNumber: true } }
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis Recetas</h1>
        <p className="text-muted-foreground">Historial de recetas médicas</p>
      </div>

      {prescriptions.length > 0 ? (
        <div className="grid gap-4">
          {prescriptions.map(prescription => {
            const medications = prescription.medications as Array<{
              name: string
              dosage: string
              frequency: string
              duration: string
            }>

            return (
              <Card key={prescription.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">RecetaMédica</CardTitle>
                    </div>
                    <Badge variant="outline">
                      {new Date(prescription.issueDate).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Dr. {prescription.doctor.name}
                      </span>
                      {prescription.doctor.specialty && (
                        <span>{prescription.doctor.specialty}</span>
                      )}
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">Medicamento</th>
                            <th className="px-4 py-2 text-left font-medium">Dosis</th>
                            <th className="px-4 py-2 text-left font-medium">Frecuencia</th>
                            <th className="px-4 py-2 text-left font-medium">Duración</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medications.map((med, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-4 py-2 font-medium">{med.name}</td>
                              <td className="px-4 py-2">{med.dosage}</td>
                              <td className="px-4 py-2">{med.frequency}</td>
                              <td className="px-4 py-2">{med.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {prescription.instructions && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm"><span className="font-medium">Instrucciones:</span> {prescription.instructions}</p>
                      </div>
                    )}

                    {prescription.validUntil && (
                      <p className="text-xs text-muted-foreground">
                        Válida hasta: {new Date(prescription.validUntil).toLocaleDateString('es-MX')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tienes recetas médicas</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
