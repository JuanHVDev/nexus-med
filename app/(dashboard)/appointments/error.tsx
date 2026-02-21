'use client'

import { ErrorBoundary } from '@/components/error-boundary'

export default function AppointmentsError({
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
      title="Error en la agenda"
      message="El calendario está confundido. Le pedimos disculpas por el inconveniente."
      imageSrc="/images/errors/error-calendar.png"
    />
  )
}
