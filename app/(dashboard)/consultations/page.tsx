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
import { FileText, Search, ChevronRight } from 'lucide-react'
import { specialtyLabels, type Specialty } from '@/lib/validations/medical-note'

interface MedicalNote {
  id: string
  createdAt: string
  chiefComplaint: string
  diagnosis: string
  specialty: Specialty | null
  type: string
  patient: {
    id: string
    firstName: string
    lastName: string
    middleName: string | null
  }
  doctor: {
    id: string
    name: string
    specialty: string | null
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function ConsultationsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<{ data: MedicalNote[]; pagination: PaginationInfo }>({
    queryKey: ['consultations', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      if (search) params.append('search', search)
      
      const res = await fetch(`/api/medical-notes?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const notes = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Consultas</h1>
        <p className="text-muted-foreground">
          Historial de consultas y notas médicas
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente o diagnóstico..."
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
              <TableHead>Especialidad</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Diagnóstico</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : notes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay consultas registradas
                </TableCell>
              </TableRow>
            ) : (
              notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(note.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {note.patient.firstName} {note.patient.lastName}
                    {note.patient.middleName && ` ${note.patient.middleName}`}
                  </TableCell>
                  <TableCell>{note.doctor.name}</TableCell>
                  <TableCell>
                    {note.specialty ? (
                      <Badge variant="outline">
                        {specialtyLabels[note.specialty] || note.specialty}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {note.chiefComplaint}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {note.diagnosis}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/patients/${note.patient.id}/notes/${note.id}`}>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        Ver
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
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
