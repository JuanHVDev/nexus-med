'use client'

import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, subDays } from "date-fns"
import { 
  DollarSign, 
  FileDown, 
  FileSpreadsheet, 
  Loader2,
  Filter
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { generateFinancialReportPDF } from "@/components/reports/financial-report-pdf"
import { exportToExcel } from "@/lib/reports/excel-export"

interface Doctor {
  id: string
  name: string
  specialty: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: string
  dateFormatted: string
  patientName: string
  doctorName: string
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
}

interface Summary {
  totalInvoices: number
  totalRevenue: number
  totalTax: number
  totalDiscounts: number
  paidAmount: number
  pendingAmount: number
  averageInvoice: number
  statusDistribution: { label: string; count: number; amount: number }[]
  paymentMethodDistribution: { label: string; count: number; amount: number }[]
  dailyRevenue: { date: string; amount: number }[]
  doctorRevenue: { doctor: string; amount: number }[]
}

const statusOptions = [
  { value: "PENDING", label: "Pendiente" },
  { value: "PAID", label: "Pagada" },
  { value: "PARTIAL", label: "Parcial" },
  { value: "CANCELLED", label: "Cancelada" },
]

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "outline",
    PAID: "secondary",
    PARTIAL: "default",
    CANCELLED: "destructive",
  }
  return variants[status] || "outline"
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    PAID: "Pagada",
    PARTIAL: "Parcial",
    CANCELLED: "Cancelada",
  }
  return labels[status] || status
}

const formatCurrency = (amount: number) => {
  return `$${amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function FinancialReportPage() {
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    doctorId: "all",
    status: "all",
  })

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  // Fetch doctors for filter
  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const response = await fetch("/api/doctors")
      if (!response.ok) throw new Error("Error al cargar médicos")
      return response.json() as Promise<{ doctors: Doctor[] }>
    },
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ["financial-report", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)
      if (filters.doctorId !== "all") params.append("doctorId", filters.doctorId)
      if (filters.status !== "all") params.append("status", filters.status)

      const response = await fetch(`/api/reports/financial?${params}`)
      if (!response.ok) throw new Error("Error al cargar reporte")
      return response.json() as Promise<{ invoices: Invoice[]; summary: Summary }>
    },
  })

  const handleGeneratePDF = useCallback(async () => {
    if (!data) return
    
    try {
      setIsGeneratingPDF(true)
      const pdfData = {
        invoices: data.invoices,
        summary: data.summary,
        filters: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          doctorId: filters.doctorId,
          status: filters.status,
        },
        clinicInfo: {
          name: "Clínica",
          info: "Sistema HC Gestor",
        },
      }
      
      const blob = await generateFinancialReportPDF(pdfData)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `reporte-financiero-${format(new Date(), "yyyy-MM-dd")}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success("PDF generado correctamente")
    } catch (error) {
      toast.error("Error al generar PDF")
      console.error(error)
    } finally {
      setIsGeneratingPDF(false)
    }
  }, [data, filters])

  const handleExportExcel = useCallback(() => {
    if (!data) return
    
    try {
      setIsExportingExcel(true)
      const excelData = data.invoices.map((inv) => ({
        Folio: inv.invoiceNumber,
        Fecha: inv.dateFormatted,
        Paciente: inv.patientName,
        Medico: inv.doctorName,
        Subtotal: inv.subtotal,
        IVA: inv.tax,
        Descuento: inv.discount,
        Total: inv.total,
        Estado: getStatusLabel(inv.status),
      }))
      
      exportToExcel(excelData, `reporte-financiero-${format(new Date(), "yyyy-MM-dd")}`)
      toast.success("Excel exportado correctamente")
    } catch (error) {
      toast.error("Error al exportar Excel")
      console.error(error)
    } finally {
      setIsExportingExcel(false)
    }
  }, [data])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <DollarSign className="h-8 w-8" />
            Reporte Financiero
          </h1>
          <p className="text-muted-foreground mt-1">
            Ingresos y análisis de facturación
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={!data || isExportingExcel}
          >
            {isExportingExcel ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Excel
          </Button>
          <Button
            onClick={handleGeneratePDF}
            disabled={!data || isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Médico</Label>
              <Select
                value={filters.doctorId}
                onValueChange={(value) => setFilters({ ...filters, doctorId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {doctors?.doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center text-red-500">
          Error al cargar el reporte. Intente nuevamente.
        </Card>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.summary.totalRevenue)}
                </div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{data.summary.totalInvoices}</div>
                <p className="text-sm text-muted-foreground">Facturas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.summary.paidAmount)}
                </div>
                <p className="text-sm text-muted-foreground">Monto Pagado</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-amber-600">
                  {formatCurrency(data.summary.pendingAmount)}
                </div>
                <p className="text-sm text-muted-foreground">Monto Pendiente</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{formatCurrency(data.summary.averageInvoice)}</div>
                <p className="text-sm text-muted-foreground">Promedio por Factura</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{formatCurrency(data.summary.totalTax)}</div>
                <p className="text-sm text-muted-foreground">Total Impuestos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{formatCurrency(data.summary.totalDiscounts)}</div>
                <p className="text-sm text-muted-foreground">Total Descuentos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">
                  {data.summary.paidAmount > 0 
                    ? Math.round((data.summary.paidAmount / (data.summary.paidAmount + data.summary.pendingAmount)) * 100)
                    : 0}%
                </div>
                <p className="text-sm text-muted-foreground">Tasa de Cobro</p>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Facturas por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.summary.statusDistribution.map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <Badge variant={getStatusBadge(s.label)}>
                        {getStatusLabel(s.label)}
                      </Badge>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{s.count}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(s.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ingresos por Médico (Top 5)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.summary.doctorRevenue.slice(0, 5).map((d) => (
                    <div key={d.doctor} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{d.doctor}</span>
                      <span className="font-medium">{formatCurrency(d.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle>Listado de Facturas ({data.invoices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Folio</th>
                      <th className="text-left py-2 px-4">Fecha</th>
                      <th className="text-left py-2 px-4">Paciente</th>
                      <th className="text-left py-2 px-4">Médico</th>
                      <th className="text-right py-2 px-4">Subtotal</th>
                      <th className="text-right py-2 px-4">IVA</th>
                      <th className="text-right py-2 px-4">Desc.</th>
                      <th className="text-right py-2 px-4">Total</th>
                      <th className="text-left py-2 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoices.slice(0, 50).map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4 font-mono text-sm">{invoice.invoiceNumber}</td>
                        <td className="py-2 px-4">{invoice.dateFormatted}</td>
                        <td className="py-2 px-4">{invoice.patientName}</td>
                        <td className="py-2 px-4">{invoice.doctorName}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(invoice.subtotal)}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(invoice.tax)}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(invoice.discount)}</td>
                        <td className="py-2 px-4 text-right font-medium">{formatCurrency(invoice.total)}</td>
                        <td className="py-2 px-4">
                          <Badge variant={getStatusBadge(invoice.status)}>
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.invoices.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Mostrando 50 de {data.invoices.length} facturas. Exporte a PDF o Excel para ver el listado completo.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
