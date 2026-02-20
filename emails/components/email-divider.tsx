import { Hr } from '@react-email/components'
import { colors } from '../styles'

export function EmailDivider() {
  return (
    <Hr
      style={{
        border: 'none',
        borderTop: `1px solid ${colors.border}`,
        margin: '24px 0',
      }}
    />
  )
}
