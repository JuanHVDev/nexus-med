'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  DollarSign, 
  Clock, 
  CheckCircle,
  XCircle,
  ChevronRight,
  FileText
} from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { InvoiceForm } from '@/components/billing/invoice-form'

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
  totalPaid: number
  patient: {
    id: string
    firstName: string
    lastName: string
    middleName: string | null
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

interface Summary {
  totalInvoices: number
  totalAmount: number
  totalPaid: number
  totalPending: number
}

export default function BillingPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading } = useQuery<{ data: Invoice[]; pagination: PaginationInfo; summary: Summary }>({
    queryKey: ['invoices', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      if (search) params.append('search', search)
      
      const res = await fetch(`/api/invoices?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const handleInvoiceCreated = () => {
    setDialogOpen(false)
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
  }

  const invoices = data?.data || []
  const pagination = data?.pagination
  const summary = data?.summary

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" /> Pendiente</Badge>
      case 'PAID':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Pagada</Badge>
      case 'PARTIAL':
        return <Badge variant="secondary" className="text-orange-600"><Clock className="h-3 w-3 mr-1" /> Parcial</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
          <p className="text-muted-foreground">
            Gestiona las facturas y pagos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Factura
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px] xl:max-w-[1000px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Nueva Factura</DialogTitle>
            </DialogHeader>
            <InvoiceForm 
              onSuccess={handleInvoiceCreated} 
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary?.totalAmount?.toLocaleString('es-MX') || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagado</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary?.totalPaid?.toLocaleString('es-MX') || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${summary?.totalPending?.toLocaleString('es-MX') || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalInvoices || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pagado</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No hay facturas registradas
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.clinicInvoiceNumber}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(invoice.issueDate), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    {invoice.patient.firstName} {invoice.patient.lastName}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${invoice.total.toLocaleString('es-MX')}
                  </TableCell>
                  <TableCell className="text-green-600">
                    ${invoice.totalPaid.toLocaleString('es-MX')}
                  </TableCell>
                  <TableCell className={invoice.total - invoice.totalPaid > 0 ? 'text-yellow-600' : ''}>
                    ${(invoice.total - invoice.totalPaid).toLocaleString('es-MX')}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(invoice.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/billing/${invoice.id}`}>
                        Ver <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.pages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: pagination.pages }, (_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink
                  onClick={() => setPage(i + 1)}
                  isActive={page === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                className={page >= pagination.pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
