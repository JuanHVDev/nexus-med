'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
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
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { Search, FileText, ChevronRight, Download } from 'lucide-react'

interface Medication {
  name: string
  dosage: string
  route: string
  frequency?: string
  duration?: string
  instructions?: string
}

interface Prescription {
  id: string
  createdAt: string
  medications: Medication[]
  instructions: string | null
  validUntil: string | null
  patient: {
    id: string
    firstName: string
    lastName: string
    middleName: string | null
    curp: string | null
  }
  doctor: {
    id: string
    name: string
    specialty: string | null
    licenseNumber: string | null
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function PrescriptionsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<{ data: Prescription[]; pagination: PaginationInfo }>({
    queryKey: ['prescriptions', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      if (search) params.append('search', search)
      
      const res = await fetch(`/api/prescriptions?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const prescriptions = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recetas</h1>
        <p className="text-muted-foreground">
          Historial de recetas médicas emitidas
        </p>
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
              <TableHead>Fecha</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Medicamentos</TableHead>
              <TableHead>Válido hasta</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : prescriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay recetas registradas
                </TableCell>
              </TableRow>
            ) : (
              prescriptions.map((prescription) => (
                <TableRow key={prescription.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(prescription.createdAt), 'dd/MM/yyyy', { locale: es })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {prescription.patient.firstName} {prescription.patient.lastName}
                    {prescription.patient.middleName && ` ${prescription.patient.middleName}`}
                  </TableCell>
                  <TableCell>{prescription.doctor.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {prescription.medications.length} medicamento{prescription.medications.length !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {prescription.validUntil 
                      ? format(new Date(prescription.validUntil), 'dd/MM/yyyy', { locale: es })
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          // Simple PDF generation - just open print dialog
                          const printWindow = window.open('', '_blank')
                          if (printWindow) {
                            const meds = prescription.medications.map((m, i) => 
                              `${i + 1}. ${m.name} - ${m.dosage} (${m.route})`
                            ).join('\n')
                            
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Receta Médica</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; padding: 40px; }
                                    h1 { text-align: center; }
                                    .section { margin: 20px 0; }
                                    .medications { margin-left: 20px; }
                                  </style>
                                </head>
                                <body>
                                  <h1>Receta Médica</h1>
                                  <div class="section">
                                    <strong>Paciente:</strong> ${prescription.patient.firstName} ${prescription.patient.lastName}<br/>
                                    <strong>CURP:</strong> ${prescription.patient.curp || 'N/A'}<br/>
                                    <strong>Fecha:</strong> ${format(new Date(prescription.createdAt), 'dd/MM/yyyy')}
                                  </div>
                                  <div class="section">
                                    <strong>Dr(a). ${prescription.doctor.name}</strong><br/>
                                    ${prescription.doctor.licenseNumber ? `Cédula: ${prescription.doctor.licenseNumber}` : ''}
                                  </div>
                                  <div class="section">
                                    <strong>Medicamentos:</strong>
                                    <div class="medications">
                                      ${meds}
                                    </div>
                                  </div>
                                  ${prescription.instructions ? `
                                  <div class="section">
                                    <strong>Instrucciones:</strong><br/>
                                    ${prescription.instructions}
                                  </div>
                                  ` : ''}
                                  <div style="margin-top: 60px; text-align: center;">
                                    _________________________<br/>
                                    Firma del médico
                                  </div>
                                </body>
                              </html>
                            `)
                            printWindow.document.close()
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Link href={`/patients/${prescription.patient.id}/notes`}>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Ver
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
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
