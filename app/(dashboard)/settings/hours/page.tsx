'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface WorkingHour {
  day: number
  enabled: boolean
  start: string
  end: string
}

interface HoursSettings {
  workingHours: WorkingHour[]
  appointmentDuration: number
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function HoursSettingsPage() {
  const queryClient = useQueryClient()
  const [initialized, setInitialized] = useState(false)
  const [formData, setFormData] = useState<HoursSettings>({
    workingHours: [
      { day: 0, enabled: false, start: '09:00', end: '18:00' },
      { day: 1, enabled: true, start: '09:00', end: '18:00' },
      { day: 2, enabled: true, start: '09:00', end: '18:00' },
      { day: 3, enabled: true, start: '09:00', end: '18:00' },
      { day: 4, enabled: true, start: '09:00', end: '18:00' },
      { day: 5, enabled: true, start: '09:00', end: '18:00' },
      { day: 6, enabled: false, start: '09:00', end: '14:00' },
    ],
    appointmentDuration: 30,
  })

  const { data, isLoading } = useQuery<HoursSettings>({
    queryKey: ['settings-hours'],
    queryFn: async () => {
      const res = await fetch('/api/settings/hours')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  if (data && !initialized) {
    setFormData({
      workingHours: data.workingHours || formData.workingHours,
      appointmentDuration: data.appointmentDuration || 30,
    })
    setInitialized(true)
  }

  const updateMutation = useMutation({
    mutationFn: async (data: HoursSettings) => {
      const res = await fetch('/api/settings/hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-hours'] })
      toast.success('Horarios guardados correctamente')
    },
    onError: () => {
      toast.error('Error al guardar los horarios')
    }
  })

  const handleToggleDay = (day: number) => {
    const newHours = formData.workingHours.map(h => 
      h.day === day ? { ...h, enabled: !h.enabled } : h
    )
    setFormData({ ...formData, workingHours: newHours })
  }

  const handleTimeChange = (day: number, field: 'start' | 'end', value: string) => {
    const newHours = formData.workingHours.map(h => 
      h.day === day ? { ...h, [field]: value } : h
    )
    setFormData({ ...formData, workingHours: newHours })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Horarios de Atención</CardTitle>
          <CardDescription>
            Configura los días y horarios de atención de la clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {formData.workingHours.map((hour) => (
                <div 
                  key={hour.day}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border",
                    hour.enabled ? "bg-card" : "bg-muted/50"
                  )}
                >
                  <div className="w-24 font-medium">
                    {DAY_NAMES[hour.day]}
                  </div>
                  <input
                    type="checkbox"
                    checked={hour.enabled}
                    onChange={() => handleToggleDay(hour.day)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="time"
                      value={hour.start}
                      onChange={(e) => handleTimeChange(hour.day, 'start', e.target.value)}
                      disabled={!hour.enabled}
                      className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                    />
                    <span className="text-muted-foreground">a</span>
                    <input
                      type="time"
                      value={hour.end}
                      onChange={(e) => handleTimeChange(hour.day, 'end', e.target.value)}
                      disabled={!hour.enabled}
                      className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                    />
                  </div>
                  {!hour.enabled && (
                    <span className="text-sm text-muted-foreground">Cerrado</span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="duration">Duración de Citas (minutos)</Label>
                <select
                  id="duration"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.appointmentDuration}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    appointmentDuration: parseInt(e.target.value) 
                  })}
                >
                  <option value={15}>15 minutos</option>
                  <option value={20}>20 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  Duración por defecto para nuevas citas
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Horarios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
