'use client'

import { ErrorBoundary } from '@/components/error-boundary'

export default function SettingsError({
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
      title="Configuración bloqueada"
      message="El panel de configuración está en mantenimiento. Vuelva pronto."
      imageSrc="/images/errors/error-settings.png"
    />
  )
}
