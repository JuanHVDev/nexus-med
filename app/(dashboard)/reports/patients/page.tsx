'use client'

import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, subDays } from "date-fns"
import { 
  Users, 
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
import { getPatientsReportPDFGenerator, getExcelExporter } from "@/lib/dynamic-imports"

interface Patient {
  id: string
  fullName: string
  curp: string | null
  age: number | null
  gender: string
  bloodType: string | null
  phone: string | null
  email: string | null
  createdAt: string
  appointmentsCount: number
  consultationsCount: number
}

interface Summary {
  totalPatients: number
  genderDistribution: { label: string; value: number; percentage: number }[]
  bloodTypeDistribution: { label: string; value: number; percentage: number }[]
}

export default function PatientsReportPage() {
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    gender: "all",
    bloodType: "all",
  })

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["patients-report", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)
      if (filters.gender !== "all") params.append("gender", filters.gender)
      if (filters.bloodType !== "all") params.append("bloodType", filters.bloodType)

      const response = await fetch(`/api/reports/patients?${params}`)
      if (!response.ok) throw new Error("Error al cargar reporte")
      return response.json() as Promise<{ patients: Patient[]; summary: Summary }>
    },
  })

  const handleGeneratePDF = useCallback(async () => {
    if (!data) return
    
    try {
      setIsGeneratingPDF(true)
      const pdfData = {
        patients: data.patients,
        summary: data.summary,
        filters: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          gender: filters.gender,
          bloodType: filters.bloodType,
        },
        clinicInfo: {
          name: "Clínica",
          info: "Sistema HC Gestor",
        },
      }
      
      const generatePatientsReportPDF = await getPatientsReportPDFGenerator()
      const blob = await generatePatientsReportPDF(pdfData)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `reporte-pacientes-${format(new Date(), "yyyy-MM-dd")}.pdf`
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

  const handleExportExcel = useCallback(async () => {
    if (!data) return
    
    try {
      setIsExportingExcel(true)
      const excelData = data.patients.map((p) => ({
        ID: p.id,
        Nombre: p.fullName,
        CURP: p.curp || "",
        Edad: p.age || "",
        Genero: p.gender === "MALE" ? "Masculino" : p.gender === "FEMALE" ? "Femenino" : "Otro",
        "Tipo de Sangre": p.bloodType || "",
        Telefono: p.phone || "",
        Email: p.email || "",
        "Fecha de Registro": format(new Date(p.createdAt), "dd/MM/yyyy"),
        Citas: p.appointmentsCount,
        Consultas: p.consultationsCount,
      }))
      
      const { exportToExcel } = await getExcelExporter()
      exportToExcel(excelData, `reporte-pacientes-${format(new Date(), "yyyy-MM-dd")}`)
      toast.success("Excel exportado correctamente")
    } catch (error) {
      toast.error("Error al exportar Excel")
      console.error(error)
    } finally {
      setIsExportingExcel(false)
    }
  }, [data])

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8" />
            Reporte de Pacientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Listado y estadísticas de pacientes registrados
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
              <Label>Género</Label>
              <Select
                value={filters.gender}
                onValueChange={(value) => setFilters({ ...filters, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="MALE">Masculino</SelectItem>
                  <SelectItem value="FEMALE">Femenino</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Sangre</Label>
              <Select
                value={filters.bloodType}
                onValueChange={(value) => setFilters({ ...filters, bloodType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {bloodTypes.map((bt) => (
                    <SelectItem key={bt} value={bt}>
                      {bt}
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
                <div className="text-2xl font-bold">{data.summary.totalPatients}</div>
                <p className="text-sm text-muted-foreground">Total de Pacientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">
                  {data.summary.genderDistribution.find((g) => g.label === "MALE")?.value || 0}
                </div>
                <p className="text-sm text-muted-foreground">Masculinos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">
                  {data.summary.genderDistribution.find((g) => g.label === "FEMALE")?.value || 0}
                </div>
                <p className="text-sm text-muted-foreground">Femeninos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">
                  {data.patients.filter((p) => p.curp).length}
                </div>
                <p className="text-sm text-muted-foreground">Con CURP</p>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Género</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.summary.genderDistribution.map((g) => (
                    <div key={g.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={g.label === "MALE" ? "default" : g.label === "FEMALE" ? "secondary" : "outline"}>
                          {g.label === "MALE" ? "Masculino" : g.label === "FEMALE" ? "Femenino" : "Otro"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{g.value}</span>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {g.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo de Sangre</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {data.summary.bloodTypeDistribution.slice(0, 8).map((bt) => (
                    <div key={bt.label} className="flex items-center justify-between p-2 bg-muted rounded">
                      <Badge variant="outline">{bt.label}</Badge>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{bt.value}</span>
                        <span className="text-xs text-muted-foreground">({bt.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patients Table */}
          <Card>
            <CardHeader>
              <CardTitle>Listado de Pacientes ({data.patients.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Nombre</th>
                      <th className="text-left py-2 px-4">CURP</th>
                      <th className="text-left py-2 px-4">Edad</th>
                      <th className="text-left py-2 px-4">Género</th>
                      <th className="text-left py-2 px-4">Tipo Sangre</th>
                      <th className="text-left py-2 px-4">Teléfono</th>
                      <th className="text-left py-2 px-4">Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.patients.slice(0, 50).map((patient) => (
                      <tr key={patient.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4">{patient.fullName}</td>
                        <td className="py-2 px-4 font-mono text-sm">{patient.curp || "-"}</td>
                        <td className="py-2 px-4">{patient.age || "-"}</td>
                        <td className="py-2 px-4">
                          <Badge variant={patient.gender === "MALE" ? "default" : "secondary"}>
                            {patient.gender === "MALE" ? "M" : patient.gender === "FEMALE" ? "F" : "O"}
                          </Badge>
                        </td>
                        <td className="py-2 px-4">{patient.bloodType || "-"}</td>
                        <td className="py-2 px-4">{patient.phone || "-"}</td>
                        <td className="py-2 px-4">
                          {format(new Date(patient.createdAt), "dd/MM/yyyy")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.patients.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Mostrando 50 de {data.patients.length} pacientes. Exporte a PDF o Excel para ver el listado completo.
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
