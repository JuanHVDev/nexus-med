'use client'

import { ErrorBoundary } from '@/components/error-boundary'

export default function PatientsError({
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
      title="Historia clínica no encontrada"
      message="Parece que este paciente se escapó. ¿Podría verificar el número de identificación?"
      imageSrc="/images/errors/error-patients.png"
    />
  )
}
