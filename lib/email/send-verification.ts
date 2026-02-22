import { render } from '@react-email/render'
import { resend, EMAIL_FROM } from './index'
import { VerificationEmail } from '@/emails/verification-email'

interface SendVerificationParams {
  email: string
  name: string
  verificationUrl: string
}

export async function sendVerificationEmail({
  email,
  name,
  verificationUrl,
}: SendVerificationParams) {
  if (!resend) {
    console.warn('Resend not configured, skipping email send')
    return { id: 'mock-id' }
  }

  const html = await render(
    VerificationEmail({
      verificationUrl,
      name,
    })
  )

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: 'Verifica tu correo electrónico - HC Gestor',
    html,
  })

  if (error) {
    console.error('Error sending verification email:', error)
    throw new Error(`Error al enviar email de verificación: ${error.message}`)
  }

  return data
}

export async function sendVerificationEmailSafe(
  params: SendVerificationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    await sendVerificationEmail(params)
    return { success: true }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
