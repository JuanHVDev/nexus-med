import { Resend } from 'resend'

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  return new Resend(apiKey)
}

export const resend = getResendClient()

export const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
