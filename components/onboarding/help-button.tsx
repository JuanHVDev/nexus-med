'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HelpCircle, Play, BookOpen, MessageCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useOnboardingStore } from '@/lib/onboarding/store'

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { resetTour } = useOnboardingStore()

  const handleStartTour = () => {
    setIsOpen(false)
    resetTour()
  }

  const handleGoToHelpCenter = () => {
    setIsOpen(false)
    router.push('/help')
  }

  const menuItems = [
    {
      icon: Play,
      label: 'Iniciar Tour Guiado',
      description: 'Recorre las principales funciones del sistema',
      action: handleStartTour,
    },
    {
      icon: BookOpen,
      label: 'Centro de Ayuda',
      description: 'Preguntas frecuentes y guías detalladas',
      action: handleGoToHelpCenter,
    },
    {
      icon: MessageCircle,
      label: 'Contactar Soporte',
      description: 'Escríbenos si tienes problemas técnicos',
      action: () => window.open('mailto:soporte@hc-gestor.com', '_blank'),
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          data-tour="help-button"
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg border-2 border-primary/20 bg-background hover:bg-primary/10 hover:scale-110 transition-all duration-200"
        >
          <HelpCircle className="h-6 w-6 text-primary" />
          <span className="sr-only">Ayuda</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            ¿En qué podemos ayudarte?
          </DialogTitle>
          <DialogDescription>
            Elige una opción para comenzar
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 mt-4">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="h-auto py-4 px-4 justify-start text-left hover:bg-primary/5"
              onClick={item.action}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
