import * as React from 'react'
import { Html, Head, Body, Container, Text } from '@react-email/components'
import { colors, fonts } from '../styles'

interface EmailLayoutProps {
  children: React.ReactNode
  previewText?: string
}

export function EmailLayout({ children, previewText }: EmailLayoutProps) {
  return (
    <Html lang="es">
      <Head>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            font-family: ${fonts.sans};
          }
        `}</style>
      </Head>
      <Body style={{ backgroundColor: colors.background, fontFamily: fonts.sans }}>
        {previewText && (
          <Text style={{ display: 'none', fontSize: '1px', color: colors.background }}>
            {previewText}
          </Text>
        )}
        <Container
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '40px 20px',
          }}
        >
          {/* Header */}
          <Container
            style={{
              backgroundColor: colors.primary,
              padding: '24px 32px',
              borderRadius: '8px 8px 0 0',
              textAlign: 'center',
            }}
          >
            <Text
              style={{
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0',
              }}
            >
              HC Gestor
            </Text>
            <Text
              style={{
                color: '#ffffff',
                fontSize: '14px',
                margin: '4px 0 0 0',
                opacity: 0.9,
              }}
            >
              Sistema de Historia Clinica
            </Text>
          </Container>

          {/* Content */}
          <Container
            style={{
              backgroundColor: colors.cardBackground,
              padding: '32px',
              borderRadius: '0 0 8px 8px',
              border: `1px solid ${colors.border}`,
              borderTop: 'none',
            }}
          >
            {children}
          </Container>

          {/* Footer */}
          <Container style={{ textAlign: 'center', marginTop: '24px' }}>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: '12px',
                margin: '0',
              }}
            >
              Este email fue enviado desde HC Gestor
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: '12px',
                margin: '4px 0 0 0',
              }}
            >
              Si tienes preguntas, contacta a tu administrador
            </Text>
          </Container>
        </Container>
      </Body>
    </Html>
  )
}
