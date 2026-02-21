'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Home, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
  title: string
  message: string
  imageSrc: string
}

export function ErrorBoundary({ error, reset, title, message, imageSrc }: ErrorBoundaryProps) {
  const router = useRouter()

  useEffect(() => {
    console.error('Error capturado:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center animate-fade-up">
        <div className="relative w-64 h-48 mx-auto mb-6">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-contain"
            priority
          />
        </div>
        
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          {title}
        </h2>
        
        <p className="text-muted-foreground mb-6">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            variant="default"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
          
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Volver al inicio
          </Button>
        </div>

        {error.digest && (
          <p className="mt-4 text-xs text-muted-foreground">
            Código de error: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
