'use client'

import Image from 'next/image'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PatientAvatarProps {
  photoUrl?: string | null
  patientName: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function PatientAvatar({
  photoUrl,
  patientName,
  size = 'md',
  className,
}: PatientAvatarProps) {
  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0',
        sizeClasses[size],
        className
      )}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={`Foto de ${patientName}`}
          fill
          className="object-cover"
          unoptimized
        />
      ) : (
        <User className={cn(iconSizes[size], 'text-muted-foreground')} />
      )}
    </div>
  )
}
