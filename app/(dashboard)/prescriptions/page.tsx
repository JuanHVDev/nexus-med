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
import { generatePrescriptionPDF } from '@/components/prescriptions/prescription-pdf'
import { toast } from 'sonner'

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
                        onClick={async () => {
                          try {
                            const pdfBlob = await generatePrescriptionPDF({
                              id: prescription.id,
                              issueDate: prescription.createdAt,
                              validUntil: prescription.validUntil,
                              instructions: prescription.instructions,
                              medications: prescription.medications,
                              patient: prescription.patient,
                              doctor: prescription.doctor,
                            })
                            const url = URL.createObjectURL(pdfBlob)
                            const link = document.createElement('a')
                            link.href = url
                            link.download = `receta-${prescription.patient.lastName}-${format(new Date(prescription.createdAt), 'yyyy-MM-dd')}.pdf`
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            URL.revokeObjectURL(url)
                          } catch (error) {
                            console.error('Error generating PDF:', error)
                            toast.error('Error al generar PDF')
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
