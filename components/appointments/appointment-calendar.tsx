'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

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
  backgroundColor?: string
  borderColor?: string
}

interface AppointmentCalendarProps {
  onSelectEvent?: (event: CalendarEvent) => void
  onSelectSlot?: (slotInfo: SlotInfo) => void
  doctorId?: string
}

export function AppointmentCalendar({ 
  onSelectEvent, 
  onSelectSlot,
  doctorId 
}: AppointmentCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(new Date())

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const start = new Date(date)
      start.setMonth(start.getMonth() - 1)
      const end = new Date(date)
      end.setMonth(end.getMonth() + 2)

      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      })

      if (doctorId) {
        params.append('doctorId', doctorId)
      }

      const response = await fetch(`/api/appointments/calendar?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        const mappedEvents: CalendarEvent[] = data.map((apt: Record<string, unknown>) => {
          const startStr = apt.start as string
          const endStr = apt.end as string
          return {
            ...apt,
            start: new Date(startStr),
            end: new Date(endStr),
          }
        })
        setEvents(mappedEvents)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }, [date, doctorId])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleSelectEvent = (event: CalendarEvent) => {
    if (onSelectEvent) {
      onSelectEvent(event)
    }
  }

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    if (onSelectSlot) {
      onSelectSlot(slotInfo)
    }
  }

  const handleNavigate = (newDate: Date) => {
    setDate(newDate)
  }

  const handleViewChange = (newView: View) => {
    setView(newView)
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.backgroundColor || '#3b82f6',
        borderColor: event.borderColor || '#3b82f6',
        color: 'white',
      }
    }
  }

  return (
    <div className="h-[600px]">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Cargando...</div>
        </div>
      ) : (
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          view={view}
          views={['month', 'week', 'day']}
          date={date}
          eventPropGetter={eventStyleGetter}
          selectable
          popup
          messages={{
            today: 'Hoy',
            previous: 'Anterior',
            next: 'Siguiente',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
            noEventsInRange: 'No hay citas en este rango',
          }}
          step={30}
          timeslots={2}
          min={new Date(2024, 0, 1, 7, 0)}
          max={new Date(2024, 0, 1, 21, 0)}
        />
      )}
    </div>
  )
}
