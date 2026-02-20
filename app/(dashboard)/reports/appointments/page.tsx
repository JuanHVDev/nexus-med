'use client'

import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, subDays } from "date-fns"
import { 
  Calendar, 
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
import { generateAppointmentsReportPDF } from "@/components/reports/appointments-report-pdf"
import { exportToExcel } from "@/lib/reports/excel-export"

interface Doctor {
  id: string
  name: string
  specialty: string
}

interface Appointment {
  id: string
  startTime: string
  endTime: string
  dateFormatted: string
  timeFormatted: string
  patientName: string
  doctorName: string
  specialty: string
  status: string
  reason: string | null
}

interface Summary {
  totalAppointments: number
  attendanceRate: number
  statusDistribution: { label: string; value: number; percentage: number }[]
  doctorDistribution: { label: string; value: number }[]
  dailyDistribution: { date: string; count: number }[]
}

const statusOptions = [
  { value: "SCHEDULED", label: "Programada" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "NO_SHOW", label: "No asistió" },
  { value: "IN_PROGRESS", label: "En progreso" },
]

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    SCHEDULED: "outline",
    CONFIRMED: "default",
    COMPLETED: "secondary",
    CANCELLED: "destructive",
    NO_SHOW: "destructive",
    IN_PROGRESS: "default",
  }
  return variants[status] || "outline"
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    SCHEDULED: "Programada",
    CONFIRMED: "Confirmada",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
    NO_SHOW: "No asistió",
    IN_PROGRESS: "En progreso",
  }
  return labels[status] || status
}

export default function AppointmentsReportPage() {
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
    queryKey: ["appointments-report", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)
      if (filters.doctorId !== "all") params.append("doctorId", filters.doctorId)
      if (filters.status !== "all") params.append("status", filters.status)

      const response = await fetch(`/api/reports/appointments?${params}`)
      if (!response.ok) throw new Error("Error al cargar reporte")
      return response.json() as Promise<{ appointments: Appointment[]; summary: Summary }>
    },
  })

  const handleGeneratePDF = useCallback(async () => {
    if (!data) return
    
    try {
      setIsGeneratingPDF(true)
      const pdfData = {
        appointments: data.appointments,
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
      
      const blob = await generateAppointmentsReportPDF(pdfData)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `reporte-citas-${format(new Date(), "yyyy-MM-dd")}.pdf`
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
      const excelData = data.appointments.map((a) => ({
        Fecha: a.dateFormatted,
        Hora: a.timeFormatted,
        Paciente: a.patientName,
        Medico: a.doctorName,
        Especialidad: a.specialty,
        Estado: getStatusLabel(a.status),
        Motivo: a.reason || "",
      }))
      
      exportToExcel(excelData, `reporte-citas-${format(new Date(), "yyyy-MM-dd")}`)
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
            <Calendar className="h-8 w-8" />
            Reporte de Citas
          </h1>
          <p className="text-muted-foreground mt-1">
            Agenda y estadísticas de citas médicas
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
                <div className="text-2xl font-bold">{data.summary.totalAppointments}</div>
                <p className="text-sm text-muted-foreground">Total de Citas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">{data.summary.attendanceRate}%</div>
                <p className="text-sm text-muted-foreground">Tasa de Asistencia</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">
                  {data.summary.statusDistribution.find((s) => s.label === "COMPLETED")?.value || 0}
                </div>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-red-600">
                  {data.summary.statusDistribution.find((s) => s.label === "CANCELLED")?.value || 0}
                </div>
                <p className="text-sm text-muted-foreground">Canceladas</p>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.summary.statusDistribution.map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <Badge variant={getStatusBadge(s.label)}>
                        {getStatusLabel(s.label)}
                      </Badge>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{s.value}</span>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {s.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Citas por Médico (Top 5)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.summary.doctorDistribution.slice(0, 5).map((d) => (
                    <div key={d.label} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{d.label}</span>
                      <span className="font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Listado de Citas ({data.appointments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Fecha</th>
                      <th className="text-left py-2 px-4">Hora</th>
                      <th className="text-left py-2 px-4">Paciente</th>
                      <th className="text-left py-2 px-4">Médico</th>
                      <th className="text-left py-2 px-4">Especialidad</th>
                      <th className="text-left py-2 px-4">Estado</th>
                      <th className="text-left py-2 px-4">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.appointments.slice(0, 50).map((appointment) => (
                      <tr key={appointment.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4">{appointment.dateFormatted}</td>
                        <td className="py-2 px-4">{appointment.timeFormatted}</td>
                        <td className="py-2 px-4">{appointment.patientName}</td>
                        <td className="py-2 px-4">{appointment.doctorName}</td>
                        <td className="py-2 px-4">{appointment.specialty}</td>
                        <td className="py-2 px-4">
                          <Badge variant={getStatusBadge(appointment.status)}>
                            {getStatusLabel(appointment.status)}
                          </Badge>
                        </td>
                        <td className="py-2 px-4">{appointment.reason || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.appointments.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Mostrando 50 de {data.appointments.length} citas. Exporte a PDF o Excel para ver el listado completo.
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
