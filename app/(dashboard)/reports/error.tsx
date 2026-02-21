'use client'

import { ErrorBoundary } from '@/components/error-boundary'

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorBoundary
      error={error}
      reset={reset}
      title="Reporte no disponible"
      message="La impresora decidió tomar un descanso. Intente generar el reporte nuevamente."
      imageSrc="/images/errors/error-reports.png"
    />
  )
}
