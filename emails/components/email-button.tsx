import * as React from 'react'
import { Button } from '@react-email/components'
import { colors } from '../styles'

interface EmailButtonProps {
  href: string
  children: React.ReactNode
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: colors.primary,
        color: '#ffffff',
        padding: '14px 28px',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: '600',
        textDecoration: 'none',
        display: 'inline-block',
        textAlign: 'center',
      }}
    >
      {children}
    </Button>
  )
}
