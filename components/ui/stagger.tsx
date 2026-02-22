'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface StaggerItemProps {
  children: React.ReactNode
  index: number
  className?: string
  delayBase?: number
  animation?: 'fade-up' | 'scale-in'
}

export function StaggerItem({
  children,
  index,
  className,
  delayBase = 100,
  animation = 'fade-up',
}: StaggerItemProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, index * delayBase)

    return () => clearTimeout(timer)
  }, [index, delayBase])

  return (
    <div
      className={cn(
        animation === 'fade-up'
          ? 'animate-stagger-fade-up'
          : 'animate-stagger-scale-in',
        isVisible && 'opacity-100',
        className
      )}
    >
      {children}
    </div>
  )
}

interface StaggerGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const gapMap = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
}

const colsMap = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export function StaggerGrid({
  children,
  columns = 3,
  gap = 'lg',
  className,
}: StaggerGridProps) {
  return (
    <div className={cn('grid', colsMap[columns], gapMap[gap], className)}>
      {children}
    </div>
  )
}
