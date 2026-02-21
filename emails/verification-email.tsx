import * as React from 'react'
import { Text, Container } from '@react-email/components'
import { EmailLayout } from './components/email-layout'
import { EmailButton } from './components/email-button'
import { EmailDivider } from './components/email-divider'
import { colors } from './styles'

interface VerificationEmailProps {
  verificationUrl: string
  name: string
}

export function VerificationEmail({
  verificationUrl,
  name,
}: VerificationEmailProps) {
  const previewText = 'Verifica tu correo electrónico - HC Gestor'

  return (
    <EmailLayout previewText={previewText}>
      <Text
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: colors.text,
          margin: '0 0 16px 0',
        }}
      >
        ¡Hola, {name}!
      </Text>

      <Text
        style={{
          fontSize: '16px',
          color: colors.text,
          lineHeight: '24px',
          margin: '0 0 24px 0',
        }}
      >
        Gracias por registrarte en <strong>HC Gestor</strong>. Para completar tu
        registro y comenzar a usar el sistema, necesitamos verificar tu correo
        electrónico.
      </Text>

      <Container
        style={{
          backgroundColor: colors.background,
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px',
        }}
      >
        <Text
          style={{
            fontSize: '14px',
            color: colors.textMuted,
            margin: '0 0 8px 0',
          }}
        >
          Haz clic en el siguiente botón para verificar tu cuenta:
        </Text>
      </Container>

      <Container style={{ textAlign: 'center', marginBottom: '24px' }}>
        <EmailButton href={verificationUrl}>Verificar mi correo</EmailButton>
      </Container>

      <EmailDivider />

      <Text
        style={{
          fontSize: '14px',
          color: colors.textMuted,
          lineHeight: '20px',
          margin: '0 0 8px 0',
        }}
      >
        Este enlace expirará en <strong>24 horas</strong>. Si no verificas tu
        correo antes de ese tiempo, deberás solicitar un nuevo enlace.
      </Text>

      <Text
        style={{
          fontSize: '14px',
          color: colors.textMuted,
          lineHeight: '20px',
          margin: '0 0 16px 0',
        }}
      >
        Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en
        tu navegador:
      </Text>

      <Text
        style={{
          fontSize: '12px',
          color: colors.primary,
          lineHeight: '18px',
          margin: '0 0 16px 0',
          wordBreak: 'break-all',
        }}
      >
        {verificationUrl}
      </Text>

      <Text
        style={{
          fontSize: '14px',
          color: colors.textMuted,
          lineHeight: '20px',
          margin: '0',
        }}
      >
        Si no creaste una cuenta en HC Gestor, puedes ignorar este correo de
        forma segura.
      </Text>
    </EmailLayout>
  )
}
