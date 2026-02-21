'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'

type VerifyStatus = 'loading' | 'success' | 'error' | 'no-token'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const callbackUrl = searchParams.get('callbackURL') || '/login'
  
  const [status, setStatus] = useState<VerifyStatus>(() => {
    return token ? 'loading' : 'no-token'
  })
  const [errorMessage, setErrorMessage] = useState('')
  const hasVerified = useRef(false)

  useEffect(() => {
    if (!token || hasVerified.current) {
      return
    }
    
    hasVerified.current = true

    const verifyEmail = async () => {
      try {
        const { error } = await authClient.verifyEmail({
          query: { token },
        })

        if (error) {
          setStatus('error')
          setErrorMessage(error.message || 'Error al verificar el correo')
        } else {
          setStatus('success')
        }
      } catch {
        setStatus('error')
        setErrorMessage('Error inesperado al verificar el correo')
      }
    }

    verifyEmail()
  }, [token])

  const handleResendEmail = () => {
    router.push('/verify-email-sent?resend=true')
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verificando tu correo electrónico...</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold text-center mb-2">
          ¡Correo verificado!
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          Tu correo electrónico ha sido verificado exitosamente.
          Ya puedes iniciar sesión en tu cuenta.
        </p>
        <Button onClick={() => router.push(callbackUrl)}>
          Ir a Iniciar Sesión
        </Button>
      </div>
    )
  }

  const isNoToken = status === 'no-token'
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <XCircle className="h-16 w-16 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-center mb-2">
        {isNoToken ? 'Token no encontrado' : 'Error de verificación'}
      </h2>
      <p className="text-muted-foreground text-center mb-2">
        {isNoToken 
          ? 'No se proporcionó un token de verificación válido.'
          : errorMessage || 'El enlace de verificación es inválido o ha expirado.'
        }
      </p>
      {!isNoToken && (
        <p className="text-sm text-muted-foreground text-center mb-6">
          Es posible que el enlace haya caducado (expira en 24 horas) o ya haya sido utilizado.
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={() => router.push('/login')}>
          Ir a Iniciar Sesión
        </Button>
        <Button onClick={handleResendEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Reenviar correo de verificación
        </Button>
      </div>
    </div>
  )
}

function VerifyEmailFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Cargando...</p>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Verificar Correo</CardTitle>
        <CardDescription className="text-center">
          Confirmando tu dirección de correo electrónico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<VerifyEmailFallback />}>
          <VerifyEmailContent />
        </Suspense>
      </CardContent>
    </Card>
  )
}
