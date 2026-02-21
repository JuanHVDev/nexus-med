import { cache } from 'react'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
})

export const getRequiredSession = cache(async () => {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
})
