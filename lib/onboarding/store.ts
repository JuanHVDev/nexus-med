import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  hasSeenTour: boolean
  tourStep: number
  isTourOpen: boolean
  isHelpOpen: boolean
  setHasSeenTour: (value: boolean) => void
  setTourStep: (step: number) => void
  setIsTourOpen: (value: boolean) => void
  setIsHelpOpen: (value: boolean) => void
  resetTour: () => void
  startTour: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenTour: false,
      tourStep: 0,
      isTourOpen: false,
      isHelpOpen: false,
      setHasSeenTour: (value) => set({ hasSeenTour: value }),
      setTourStep: (step) => set({ tourStep: step }),
      setIsTourOpen: (value) => set({ isTourOpen: value }),
      setIsHelpOpen: (value) => set({ isHelpOpen: value }),
      resetTour: () => set({ hasSeenTour: false, tourStep: 0, isTourOpen: true }),
      startTour: () => set({ isTourOpen: true, tourStep: 0 }),
    }),
    {
      name: 'onboarding-storage',
    }
  )
)
