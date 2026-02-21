'use client'

import { ErrorBoundary } from '@/components/error-boundary'

export default function DashboardError({
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
      title="Página no disponible"
      message="El consultorio está temporalmente cerrado. Por favor, intente nuevamente."
      imageSrc="/images/errors/error-general.png"
    />
  )
}
