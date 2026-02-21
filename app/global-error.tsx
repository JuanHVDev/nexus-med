'use client'

import Image from 'next/image'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error global:', error)
  }, [error])

  return (
    <html lang="es">
      <body className="bg-background">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="relative w-64 h-48 mx-auto mb-6">
              <Image
                src="/images/errors/error-general.png"
                alt="Error del sistema"
                fill
                className="object-contain"
                priority
              />
            </div>
            
            <h1 className="text-3xl font-bold text-foreground mb-2">
              ¡Vaya! Algo salió mal
            </h1>
            
            <p className="text-muted-foreground mb-6">
              El sistema necesita un momento. Nuestros médicos ya están revisando el caso.
            </p>

            <button
              onClick={reset}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Reintentar
            </button>

            {error.digest && (
              <p className="mt-4 text-xs text-muted-foreground">
                Código de error: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
