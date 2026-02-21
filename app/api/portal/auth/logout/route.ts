import { NextResponse } from 'next/server'
import { portalLogout } from '@/lib/portal/auth'

export async function POST() {
  try {
    await portalLogout()
    return NextResponse.redirect(new URL('/portal/login', 'http://localhost:3000'))
  } catch (error) {
    console.error('Portal logout error:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}
