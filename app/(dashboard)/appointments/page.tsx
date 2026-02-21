'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppointmentList } from '@/components/appointments/appointment-list'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AppointmentForm } from '@/components/appointments/appointment-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import type { AppointmentInputFormData } from '@/lib/validations/appointment'
import { Loader2 } from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    appointmentId: string
    patientId: string
    patientName: string
    doctorId: string
    doctorName: string
    status: string
    reason?: string
  }
}

interface SlotInfo {
  start: Date
  end: Date
  slots: Date[]
  action: 'select' | 'click' | 'doubleClick'
}

const AppointmentCalendar = dynamic(
  () => import('@/components/appointments/appointment-calendar').then(mod => ({ default: mod.AppointmentCalendar })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full rounded-lg border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Cargando calendario...</p>
        </div>
      </div>
    ),
  }
)

function AppointmentsContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null)

  const { data: appointmentsData } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const res = await fetch('/api/appointments?limit=100')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: AppointmentInputFormData) => {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to create')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setDialogOpen(false)
      setSelectedSlot(null)
      toast.success('Cita creada correctamente')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la cita')
    }
  })

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot({
      start: slotInfo.start.toISOString().slice(0, 16),
      end: slotInfo.end.toISOString().slice(0, 16),
    })
    setDialogOpen(true)
  }, [])

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    router.push(`/appointments/${event.resource.appointmentId}`)
  }, [router])

  const handleSubmit = async (data: AppointmentInputFormData) => {
    await createMutation.mutateAsync(data)
  }

  const appointments = appointmentsData?.data || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Citas</h1>
          <p className="text-muted-foreground">
            Gestiona las citas médicas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Cita</DialogTitle>
            </DialogHeader>
            <AppointmentForm
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending}
              defaultValues={selectedSlot ? {
                startTime: selectedSlot.start,
                endTime: selectedSlot.end,
              } : undefined}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-4">
          <AppointmentCalendar
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
          />
        </TabsContent>
        
        <TabsContent value="list" className="mt-4">
          <AppointmentList 
            appointments={appointments}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AppointmentsPage() {
  return <AppointmentsContent />
}
