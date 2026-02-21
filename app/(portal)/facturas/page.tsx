import { getPortalSession } from '@/lib/portal/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Receipt, CreditCard, Banknote } from 'lucide-react'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  PENDING: { label: 'Pendiente', variant: 'default' },
  PAID: { label: 'Pagada', variant: 'secondary' },
  PARTIAL: { label: 'Parcial', variant: 'outline' },
  CANCELLED: { label: 'Cancelada', variant: 'destructive' },
}

export default async function PortalFacturasPage() {
  const session = await getPortalSession()

  if (!session) return null

  const invoices = await prisma.invoice.findMany({
    where: { patientId: session.patientId },
    orderBy: { issueDate: 'desc' },
    include: {
      issuedBy: { select: { name: true } },
      items: {
        include: { service: { select: { name: true } } }
      },
      payments: true
    }
  })

  const totalPending = invoices
    .filter(i => i.status === 'PENDING' || i.status === 'PARTIAL')
    .reduce((sum, i) => sum + Number(i.total), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis Facturas</h1>
          <p className="text-muted-foreground">Historial de facturación y pagos</p>
        </div>
      </div>

      {totalPending > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-800">
                <Banknote className="h-5 w-5" />
                <span className="font-medium">Total Pendiente: ${totalPending.toFixed(2)} MXN</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {invoices.length > 0 ? (
        <div className="space-y-4">
          {invoices.map(invoice => (
            <Card key={invoice.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Factura #{invoice.clinicInvoiceNumber}</CardTitle>
                  </div>
                  <Badge variant={statusLabels[invoice.status]?.variant || 'outline'}>
                    {statusLabels[invoice.status]?.label || invoice.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Fecha: {new Date(invoice.issueDate).toLocaleDateString('es-MX')}</span>
                    {invoice.dueDate && (
                      <span>Vence: {new Date(invoice.dueDate).toLocaleDateString('es-MX')}</span>
                    )}
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Servicio</th>
                          <th className="px-4 py-2 text-right font-medium">Cant.</th>
                          <th className="px-4 py-2 text-right font-medium">Precio</th>
                          <th className="px-4 py-2 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2">{item.description}</td>
                            <td className="px-4 py-2 text-right">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">${Number(item.total).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/30">
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-right font-medium">Subtotal</td>
                          <td className="px-4 py-2 text-right">${Number(invoice.subtotal).toFixed(2)}</td>
                        </tr>
                        {Number(invoice.tax) > 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right">IVA</td>
                            <td className="px-4 py-2 text-right">${Number(invoice.tax).toFixed(2)}</td>
                          </tr>
                        )}
                        {Number(invoice.discount) > 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right">Descuento</td>
                            <td className="px-4 py-2 text-right">-${Number(invoice.discount).toFixed(2)}</td>
                          </tr>
                        )}
                        <tr className="font-bold">
                          <td colSpan={3} className="px-4 py-2 text-right">Total</td>
                          <td className="px-4 py-2 text-right">${Number(invoice.total).toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {invoice.payments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Pagos Realizados</p>
                      <div className="space-y-2">
                        {invoice.payments.map(payment => (
                          <div key={payment.id} className="flex items-center justify-between bg-muted/50 p-2 rounded text-sm">
                            <span className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              {new Date(payment.paymentDate).toLocaleDateString('es-MX')}
                            </span>
                            <span className="font-medium">${Number(payment.amount).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tienes facturas</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
