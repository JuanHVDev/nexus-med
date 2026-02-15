'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Eye, Edit, Plus, Stethoscope } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface NotesPageProps {
  params: Promise<{ id: string }>
}

export default function PatientNotesPage({ params }: NotesPageProps) {
  const { id: patientId } = use(params)

  const { data: notes, isLoading } = useQuery({
    queryKey: ['patient-notes', patientId],
    queryFn: () => fetch(`/api/patients/${patientId}/notes`).then(r => r.json()),
    enabled: !!patientId
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/patients/${patientId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notas Médicas</h1>
            <p className="text-muted-foreground">
              {notes?.length || 0} nota(s) registrada(s)
            </p>
          </div>
        </div>
        <Link href={`/patients/${patientId}/notes/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Nota
          </Button>
        </Link>
      </div>

      {notes && notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note: any) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {note.specialty ? (
                          <span className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            {note.specialty}
                          </span>
                        ) : (
                          'Consulta'
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground font-normal">
                        {format(new Date(note.createdAt), 'dd MMMM yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{note.type || 'CONSULTATION'}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {note.chiefComplaint && (
                    <div>
                      <p className="text-sm text-muted-foreground">Motivo de consulta</p>
                      <p className="font-medium">{note.chiefComplaint}</p>
                    </div>
                  )}
                  {note.diagnosis && (
                    <div>
                      <p className="text-sm text-muted-foreground">Diagnóstico</p>
                      <p>{note.diagnosis}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">
                      Dr. {note.doctor?.name || 'No especificado'}
                    </p>
                    <div className="flex gap-2">
                      <Link href={`/patients/${patientId}/notes/${note.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </Link>
                      <Link href={`/patients/${patientId}/notes/${note.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No hay notas médicas registradas</p>
            <Link href={`/patients/${patientId}/notes/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear primera nota
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
