'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Plus, 
  Trash2,
  Loader2,
  FileText,
  CreditCard,
  Banknote,
  Building,
  FileCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { InvoicePDF, generateInvoicePDF } from '@/components/billing/invoice-pdf'

interface InvoiceItem {
  id: string
  serviceId: string | null
  description: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

interface Payment {
  id: string
  amount: number
  method: string
  reference: string | null
  notes: string | null
  paymentDate: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  curp: string | null
}

interface Invoice {
  id: string
  clinicInvoiceNumber: string
  issueDate: string
  dueDate: string | null
  status: string
  subtotal: number
  tax: number
  discount: number
  total: number
  notes: string | null
  patient: Patient
  issuedBy: { id: string; name: string }
  items: InvoiceItem[]
  payments: Payment[]
  totalPaid: number
}

export default function InvoiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string
  const queryClient = useQueryClient()
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'CASH' as 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK',
    reference: '',
    notes: ''
  })
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}`)
      if (!res.ok) throw new Error('Failed to fetch invoice')
      return res.json()
    }
  })

  const createPaymentMutation = useMutation({
    mutationFn: async (data: typeof paymentForm) => {
      const res = await fetch(`/api/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount)
        })
      })
      if (!res.ok) throw new Error('Failed to create payment')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setPaymentDialogOpen(false)
      setPaymentForm({ amount: '', method: 'CASH', reference: '', notes: '' })
      toast.success('Pago registrado exitosamente')
    },
    onError: () => {
      toast.error('Error al registrar pago')
    }
  })

  const handleDownloadPDF = async () => {
    if (!invoice) return
    
    try {
      setDownloadingPdf(true)
      const blob = await generateInvoicePDF(invoice)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `factura-${invoice.clinicInvoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleSubmitPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Ingrese un monto válido')
      return
    }
    
    const pending = invoice!.total - invoice!.totalPaid
    if (parseFloat(paymentForm.amount) > pending) {
      toast.error('El monto excede el saldo pendiente')
      return
    }

    setSubmittingPayment(true)
    createPaymentMutation.mutate(paymentForm)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendiente</Badge>
      case 'PAID':
        return <Badge className="bg-green-600">Pagada</Badge>
      case 'PARTIAL':
        return <Badge variant="secondary" className="text-orange-600">Parcial</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Banknote className="h-4 w-4" />
      case 'CARD':
        return <CreditCard className="h-4 w-4" />
      case 'TRANSFER':
        return <Building className="h-4 w-4" />
      case 'CHECK':
        return <FileCheck className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH': return 'Efectivo'
      case 'CARD': return 'Tarjeta'
      case 'TRANSFER': return 'Transferencia'
      case 'CHECK': return 'Cheque'
      default: return method
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Factura no encontrada</p>
        <Button asChild className="mt-4">
          <Link href="/billing">Volver a Facturación</Link>
        </Button>
      </div>
    )
  }

  const pending = invoice.total - invoice.totalPaid

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Factura {invoice.clinicInvoiceNumber}
          </h1>
          <p className="text-muted-foreground">
            Fecha: {format(new Date(invoice.issueDate), 'dd MMMM yyyy', { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF} disabled={downloadingPdf}>
            {downloadingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Descargar PDF
          </Button>
          {pending > 0 && (
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Pago
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Pago</DialogTitle>
                  <DialogDescription>
                    Saldo pendiente: ${pending.toFixed(2)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={pending}
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Método de Pago</Label>
                    <Select
                      value={paymentForm.method}
                      onValueChange={(value: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK') => 
                        setPaymentForm({ ...paymentForm, method: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Efectivo</SelectItem>
                        <SelectItem value="CARD">Tarjeta</SelectItem>
                        <SelectItem value="TRANSFER">Transferencia</SelectItem>
                        <SelectItem value="CHECK">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Referencia (opcional)</Label>
                    <Input
                      id="reference"
                      value={paymentForm.reference}
                      onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                      placeholder="Número de transacción"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Input
                      id="notes"
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      placeholder="Notas adicionales"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmitPayment} disabled={submittingPayment}>
                    {submittingPayment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Registrar Pago
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {getStatusBadge(invoice.status)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            ${invoice.total.toLocaleString('es-MX')}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
          </CardHeader>
          <CardContent className={`text-2xl font-bold ${pending > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            ${pending.toLocaleString('es-MX')}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos del Paciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-muted-foreground text-sm block">Nombre</span>
              <span className="font-medium">
                {invoice.patient.firstName} {invoice.patient.middleName || ''} {invoice.patient.lastName}
              </span>
            </div>
            {invoice.patient.curp && (
              <div>
                <span className="text-muted-foreground text-sm block">CURP</span>
                <span className="font-mono">{invoice.patient.curp}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos de la Factura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-muted-foreground text-sm block">Emitido por</span>
              <span className="font-medium">{invoice.issuedBy.name}</span>
            </div>
            {invoice.dueDate && (
              <div>
                <span className="text-muted-foreground text-sm block">Fecha de Vencimiento</span>
                <span className="font-medium">
                  {format(new Date(invoice.dueDate), 'dd MMMM yyyy', { locale: es })}
                </span>
              </div>
            )}
            {invoice.notes && (
              <div>
                <span className="text-muted-foreground text-sm block">Notas</span>
                <span className="font-medium">{invoice.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conceptos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">P. Unit.</TableHead>
                <TableHead className="text-right">Descuento</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${item.discount.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">${item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">Subtotal</TableCell>
                <TableCell className="text-right">${invoice.subtotal.toFixed(2)}</TableCell>
              </TableRow>
              {invoice.discount > 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-right">Descuento</TableCell>
                  <TableCell className="text-right text-red-600">-${invoice.discount.toFixed(2)}</TableCell>
                </TableRow>
              )}
              {invoice.tax > 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-right">Impuesto</TableCell>
                  <TableCell className="text-right">${invoice.tax.toFixed(2)}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={4} className="text-right font-bold text-lg">Total</TableCell>
                <TableCell className="text-right font-bold text-lg">${invoice.total.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historial de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.paymentDate), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMethodIcon(payment.method)}
                        {getMethodLabel(payment.method)}
                      </div>
                    </TableCell>
                    <TableCell>{payment.reference || '-'}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ${payment.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
