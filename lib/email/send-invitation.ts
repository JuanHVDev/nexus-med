import { render } from '@react-email/render'
import { resend, EMAIL_FROM, APP_URL } from './index'
import { InvitationEmail } from '@/emails/invitation-email'

interface SendInvitationParams {
  email: string
  token: string
  clinicName: string
  role: string
  invitedByName: string
}

export async function sendInvitationEmail({
  email,
  token,
  clinicName,
  role,
  invitedByName,
}: SendInvitationParams) {
  const invitationUrl = `${APP_URL}/invitations/${token}`

  const html = await render(
    InvitationEmail({
      invitationUrl,
      clinicName,
      role,
      invitedByName,
    })
  )

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Invitacion a ${clinicName} - HC Gestor`,
    html,
  })

  if (error) {
    console.error('Error sending invitation email:', error)
    throw new Error(`Error al enviar email: ${error.message}`)
  }

  return data
}
