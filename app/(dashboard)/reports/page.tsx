import { Metadata } from "next"
import Link from "next/link"
import { 
  Users, 
  Calendar, 
  DollarSign, 
  FileText, 
  ChevronRight,
  BarChart3,
  Download
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Reportes",
  description: "Generación de reportes y estadísticas",
}

const reportTypes = [
  {
    id: "patients",
    title: "Reporte de Pacientes",
    description: "Listado completo de pacientes con estadísticas por género, tipo de sangre y edad.",
    icon: Users,
    href: "/reports/patients",
    color: "bg-blue-500",
    features: ["Lista de pacientes", "Distribución por género", "Distribución por tipo de sangre"],
  },
  {
    id: "appointments",
    title: "Reporte de Citas",
    description: "Análisis de citas médicas con filtros por fecha, médico y estado.",
    icon: Calendar,
    href: "/reports/appointments",
    color: "bg-green-500",
    features: ["Citas por período", "Tasa de asistencia", "Distribución por médico"],
  },
  {
    id: "financial",
    title: "Reporte Financiero",
    description: "Ingresos, facturas y análisis financiero detallado de la clínica.",
    icon: DollarSign,
    href: "/reports/financial",
    color: "bg-amber-500",
    features: ["Ingresos totales", "Facturas por estado", "Ingresos por médico"],
  },
  {
    id: "medical",
    title: "Reporte de Consultas",
    description: "Actividad médica, diagnósticos frecuentes y estadísticas clínicas.",
    icon: FileText,
    href: "/reports/medical",
    color: "bg-purple-500",
    features: ["Consultas por especialidad", "Top diagnósticos", "Recetas y estudios"],
  },
]

export default function ReportsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground mt-1">
            Genera reportes detallados con estadísticas y gráficas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <Link key={report.id} href={report.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${report.color} text-white`}>
                    <report.icon className="h-6 w-6" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Incluye:</p>
                  <ul className="space-y-1">
                    {report.features.map((feature, index) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-3 w-3 text-muted-foreground" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Download className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Formatos de Exportación</h3>
              <p className="text-sm text-muted-foreground">
                Todos los reportes pueden exportarse en formato PDF (con gráficas) o Excel (datos tabulares)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
