'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Joyride, { CallBackProps, STATUS, EVENTS } from 'react-joyride'
import { useOnboardingStore } from '@/lib/onboarding/store'
import { getStepsForRole } from '@/lib/onboarding/steps'
import { useTheme } from 'next-themes'

const JoyrideNoSSR = dynamic(() => import('react-joyride').then(mod => mod.default), { ssr: false })

interface OnboardingTourProps {
  userRole?: string
}

export function OnboardingTour({ userRole = 'DOCTOR' }: OnboardingTourProps) {
  const [mounted, setMounted] = useState(false)
  const { hasSeenTour, isTourOpen, setHasSeenTour, setIsTourOpen, setTourStep } =
    useOnboardingStore()
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, index } = data

      if (type === ('TOOLTIP' as unknown as typeof EVENTS).STEP_AFTER || type === ('TOOLTIP' as unknown as typeof EVENTS).TARGET_NOT_FOUND) {
        setTourStep(index + 1)
      }

      if (status === ('finished' as unknown as typeof STATUS).FINISHED || status === ('skipped' as unknown as typeof STATUS).SKIPPED) {
        setIsTourOpen(false)
        setHasSeenTour(true)
      }
    },
    [setTourStep, setIsTourOpen, setHasSeenTour]
  )

  useEffect(() => {
    if (!hasSeenTour && !isTourOpen) {
      const timer = setTimeout(() => {
        setIsTourOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [hasSeenTour, isTourOpen, setIsTourOpen])

  if (!mounted) {
    return null
  }

  if (hasSeenTour && !isTourOpen) {
    return null
  }

  return (
    <Joyride
      steps={getStepsForRole(userRole)}
      run={isTourOpen}
      continuous
      showSkipButton
      showProgress
      floaterProps={{
        disableAnimation: true,
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#10b981',
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          textColor: theme === 'dark' ? '#f3f4f6' : '#1f2937',
          arrowColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
      locale={{
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Omitir',
      }}
      callback={handleJoyrideCallback}
    />
  )
}
