import * as React from 'react'
import { Text, Container } from '@react-email/components'
import { EmailLayout } from './components/email-layout'
import { EmailButton } from './components/email-button'
import { EmailDivider } from './components/email-divider'
import { colors, roleLabels } from './styles'

interface InvitationEmailProps {
  invitationUrl: string
  clinicName: string
  role: string
  invitedByName: string
}

export function InvitationEmail({
  invitationUrl,
  clinicName,
  role,
  invitedByName,
}: InvitationEmailProps) {
  const roleLabel = roleLabels[role] || role
  const previewText = `Has sido invitado a unirte a ${clinicName}`

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
        ¡Hola!
      </Text>

      <Text
        style={{
          fontSize: '16px',
          color: colors.text,
          lineHeight: '24px',
          margin: '0 0 24px 0',
        }}
      >
        Has sido invitado a unirte al equipo de{' '}
        <strong>{clinicName}</strong> en HC Gestor.
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
          Detalles de la invitacion:
        </Text>
        <Text
          style={{
            fontSize: '16px',
            color: colors.text,
            margin: '0 0 4px 0',
          }}
        >
          <strong>Clínica:</strong> {clinicName}
        </Text>
        <Text
          style={{
            fontSize: '16px',
            color: colors.text,
            margin: '0 0 4px 0',
          }}
        >
          <strong>Rol:</strong> {roleLabel}
        </Text>
        <Text
          style={{
            fontSize: '16px',
            color: colors.text,
            margin: '0',
          }}
        >
          <strong>Invitado por:</strong> {invitedByName}
        </Text>
      </Container>

      <Container style={{ textAlign: 'center', marginBottom: '24px' }}>
        <EmailButton href={invitationUrl}>Aceptar Invitacion</EmailButton>
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
        Esta invitacion expirara en <strong>7 dias</strong>. Si no aceptas antes
        de esa fecha, deberas solicitar una nueva invitacion.
      </Text>

      <Text
        style={{
          fontSize: '14px',
          color: colors.textMuted,
          lineHeight: '20px',
          margin: '0',
        }}
      >
        Si tienes alguna pregunta o no esperabas esta invitacion, puedes ignorar
        este correo.
      </Text>
    </EmailLayout>
  )
}
