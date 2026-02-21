'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

function VerifyEmailSentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''
  const isResend = searchParams.get('resend') === 'true'
  
  const [inputEmail, setInputEmail] = useState(email)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(!isResend)

  const handleResendEmail = async () => {
    if (!inputEmail) {
      toast.error('Por favor ingresa tu correo electrónico')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: inputEmail,
        callbackURL: '/login',
      })

      if (error) {
        toast.error(error.message || 'Error al enviar el correo')
      } else {
        setEmailSent(true)
        toast.success('Correo de verificación enviado')
      }
    } catch {
      toast.error('Error inesperado al enviar el correo')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative mb-4">
          <Mail className="h-16 w-16 text-primary" />
          <CheckCircle className="h-6 w-6 text-green-500 absolute -bottom-1 -right-1 bg-background rounded-full" />
        </div>
        
        <h2 className="text-xl font-semibold text-center mb-2">
          ¡Revisa tu correo!
        </h2>
        
        {inputEmail && (
          <p className="text-primary font-medium text-center mb-2">
            {inputEmail}
          </p>
        )}
        
        <p className="text-muted-foreground text-center mb-6 max-w-sm">
          Hemos enviado un enlace de verificación a tu correo electrónico.
          Haz clic en el enlace para activar tu cuenta.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 mb-6 max-w-sm w-full">
          <p className="text-sm text-muted-foreground text-center">
            <strong>¿No recibiste el correo?</strong>
            <br />
            Revisa tu carpeta de spam o correo no deseado.
            El enlace expira en 24 horas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={() => router.push('/login')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ir a Iniciar Sesión
          </Button>
          <Button
            variant="secondary"
            onClick={() => setEmailSent(false)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Reenviar correo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Mail className="h-16 w-16 text-primary mb-4" />
      
      <h2 className="text-xl font-semibold text-center mb-2">
        Reenviar correo de verificación
      </h2>
      
      <p className="text-muted-foreground text-center mb-6 max-w-sm">
        Ingresa tu correo electrónico y te enviaremos un nuevo enlace de verificación.
      </p>

      <div className="w-full max-w-sm space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleResendEmail()}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleResendEmail}
          disabled={isLoading || !inputEmail}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Mail className="h-4 w-4 mr-2" />
          )}
          Enviar correo de verificación
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => router.push('/login')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Iniciar Sesión
        </Button>
      </div>
    </div>
  )
}

function VerifyEmailSentFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Cargando...</p>
    </div>
  )
}

export default function VerifyEmailSentPage() {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Verificación de Correo</CardTitle>
        <CardDescription className="text-center">
          Confirma tu dirección de correo electrónico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<VerifyEmailSentFallback />}>
          <VerifyEmailSentContent />
        </Suspense>
      </CardContent>
    </Card>
  )
}
