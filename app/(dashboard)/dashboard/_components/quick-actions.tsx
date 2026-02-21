import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar } from 'lucide-react'
import { MotionItem } from '@/components/ui/motion-container'

export function QuickActions() {
  return (
    <MotionItem className="md:col-span-2">
      <Card className="h-full border-none shadow-soft-elevated bg-muted/50 backdrop-blur-md border border-white/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-serif">Acciones de Control</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Link
            href="/patients/new"
            className="flex items-center justify-center gap-2 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 py-3 rounded-xl transition-all font-sans text-sm font-medium hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 text-primary" />
            Paciente
          </Link>
          <Link
            href="/appointments/new"
            className="flex items-center justify-center gap-2 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 py-3 rounded-xl transition-all font-sans text-sm font-medium hover:scale-[1.02] active:scale-[0.98]"
          >
            <Calendar className="h-4 w-4 text-primary" />
            Nueva Cita
          </Link>
        </CardContent>
      </Card>
    </MotionItem>
  )
}
