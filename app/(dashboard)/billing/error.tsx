'use client'

import { ErrorBoundary } from '@/components/error-boundary'

export default function BillingError({
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
      title="Error financiero"
      message="Los números no cuadran. Nuestro contador está revisando los libros."
      imageSrc="/images/errors/error-billing.png"
    />
  )
}
