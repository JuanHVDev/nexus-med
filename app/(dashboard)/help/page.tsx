'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Video,
  Mail,
  Phone,
  MessageCircle,
  ArrowLeft,
  FileText,
  Users,
  Calendar,
  CreditCard,
  Settings,
  Plus,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface FAQ {
  question: string
  answer: string
}

interface FAQCategory {
  title: string
  icon: React.ComponentType<{ className?: string }>
  faqs: FAQ[]
}

interface FAQItemProps {
  question: string
  answer: string
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium">{question}</span>
        {isOpen ? (
          <Minus className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Plus className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <p className="text-muted-foreground">{answer}</p>
        </div>
      )}
    </div>
  )
}

const faqCategories: FAQCategory[] = [
  {
    title: 'Pacientes',
    icon: Users,
    faqs: [
      {
        question: '¿Cómo registro un nuevo paciente?',
        answer:
          'Para registrar un nuevo paciente, ve a Pacientes > Nuevo Paciente. Completa los datos requeridos: nombre completo, fecha de nacimiento, género, y CURP (opcional). El sistema validará que la CURP sea correcta según el formato oficial.',
      },
      {
        question: '¿Cómo cargo la foto del paciente?',
        answer:
          'En la página de detalle del paciente, busca el área de foto y haz clic en "Subir foto". Puedes cargar imágenes en formato JPG o PNG. La foto se almacenará de forma segura.',
      },
      {
        question: '¿Cómo busco un paciente por CURP?',
        answer:
          'Usa el campo de búsqueda en la lista de pacientes. Puedes buscar por nombre, apellido o CURP. El sistema mostrará resultados en tiempo real.',
      },
      {
        question: '¿Qué es el expediente electrónico?',
        answer:
          'El expediente electrónico contiene toda la información médica del paciente: antecedentes heredofamiliares, personales patológicos, alergias, medicamentos actuales, y el historial de consultas.',
      },
    ],
  },
  {
    title: 'Citas',
    icon: Calendar,
    faqs: [
      {
        question: '¿Cómo agendo una nueva cita?',
        answer:
          'Ve a Citas > Nueva Cita. Selecciona el paciente, el médico, la fecha y hora. El sistema verificará que no haya conflictos de horario.',
      },
      {
        question: '¿Puedo ver el calendario de todos los médicos?',
        answer:
          'Sí, en la vista de calendario puedes filtrar por médico o ver todas las citas. Usa los filtros en la parte superior del calendario.',
      },
      {
        question: '¿Cómo cancelo una cita?',
        answer:
          'Haz clic en la cita en el calendario y selecciona "Cancelar". También puedes hacerlo desde la lista de citas.',
      },
    ],
  },
  {
    title: 'Notas Médicas',
    icon: BookOpen,
    faqs: [
      {
        question: '¿Cómo creo una nota médica?',
        answer:
          'Desde el historial del paciente, haz clic en "Nueva Nota" o ve a Consultas > Nueva Consulta. Selecciona la especialidad y completa los campos.',
      },
      {
        question: '¿Qué especialidades están disponibles?',
        answer:
          'El sistema incluye 10 especialidades: Medicina General, Pediatría, Ginecología, Cardiología, Dermatología, Ortopedia, Oftalmología, Otorrinolaringología, Neurología y Psiquiatría.',
      },
      {
        question: '¿Cómo agrego signos vitales?',
        answer:
          'En la nota médica, usa la sección de "Signos Vitales" para registrar: presión arterial, frecuencia cardíaca, temperatura, frecuencia respiratoria, peso y talla.',
      },
    ],
  },
  {
    title: 'Facturación',
    icon: CreditCard,
    faqs: [
      {
        question: '¿Cómo creo una factura?',
        answer:
          'Ve a Facturación > Nueva Factura. Selecciona el paciente, agrega los servicios y el sistema calculará el total. Luego puedes registrar el pago.',
      },
      {
        question: '¿Qué métodos de pago acepta el sistema?',
        answer:
          'El sistema registra: efectivo, tarjeta, transferencia y cheque. Cada pago se asocia a una factura específica.',
      },
      {
        question: '¿Cómo veo el historial de pagos de un paciente?',
        answer:
          'En el detalle del paciente, sección "Facturación", puedes ver todas las facturas y pagos relacionados.',
      },
    ],
  },
  {
    title: 'Configuración',
    icon: Settings,
    faqs: [
      {
        question: '¿Cómo configuro los horarios de los médicos?',
        answer:
          'Ve a Configuración > Horarios. Selecciona el médico y configura sus días de trabajo y horarios de atención.',
      },
      {
        question: '¿Cómo invito a nuevos usuarios?',
        answer:
          'En Configuración > Equipo, usa "Invitar Usuario". Ingresa el correo y selecciona el rol. El usuario recibirá un correo para crear su cuenta.',
      },
      {
        question: '¿Qué roles existen en el sistema?',
        answer:
          'Hay 4 roles: Administrador (acceso total), Doctor (consultas y pacientes), Recepción (citas y pacientes), y Enfermera (signos vitales y apoyo).',
      },
    ],
  },
]

const videoGuides = [
  {
    title: 'Tutorial: Primeros Pasos',
    duration: '5 min',
    description: 'Aprende a navegar por el sistema y configurar tu clínica.',
  },
  {
    title: 'Cómo Registrar Pacientes',
    duration: '8 min',
    description: 'Guía completa para registrar y gestionar pacientes.',
  },
  {
    title: 'Sistema de Citas',
    duration: '6 min',
    description: 'Aprende a agendar y gestionar citas médicas.',
  },
  {
    title: 'Notas Médicas y Recetas',
    duration: '10 min',
    description: 'Cómo crear notas médicas y prescribir recetas.',
  },
]

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  const filteredFaqs = faqCategories
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.faqs.length > 0)

  const toggleCategory = (title: string) => {
    setOpenCategory(openCategory === title ? null : title)
  }

  return (
    <div className="container mx-auto p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-primary" />
            Centro de Ayuda
          </h1>
          <p className="text-muted-foreground mt-1">
            Encuentra respuestas a tus preguntas y aprende a usar el sistema
          </p>
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar en las preguntas frecuentes..."
          className="pl-10 h-12 text-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {searchQuery && filteredFaqs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Resultados de búsqueda ({filteredFaqs.reduce((acc, c) => acc + c.faqs.length, 0)})
          </h2>
          <div className="space-y-2">
            {filteredFaqs.flatMap((category) =>
              category.faqs.map((faq, index) => (
                <FAQItem key={`${category.title}-${index}`} question={faq.question} answer={faq.answer} />
              ))
            )}
          </div>
        </div>
      )}

      {!searchQuery && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Videos Tutoriales
                </CardTitle>
                <CardDescription>Aprende con videos cortos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Explora nuestra biblioteca de videos con guías paso a paso para cada función del sistema.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Guías PDF
                </CardTitle>
                <CardDescription>Manuales descargables</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Descarga manuales completos en PDF para cada rol: Doctor, Recepción y Administrador.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  Soporte Directo
                </CardTitle>
                <CardDescription>Estamos para ayudarte</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Contáctanos por correo o teléfono. Nuestro equipo te responderá en menos de 24 horas.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-12">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Video className="h-5 w-5" />
              Videos Tutoriales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {videoGuides.map((video, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Video className="h-12 w-12 text-primary/50" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm mb-1">{video.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{video.description}</p>
                    <span className="text-xs text-primary font-medium">{video.duration}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {!searchQuery && (
        <div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Preguntas Frecuentes
          </h2>
          <div className="space-y-4">
            {faqCategories.map((category) => (
              <div key={category.title} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.title)}
                  className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <category.icon className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{category.title}</span>
                  </div>
                  {openCategory === category.title ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                {openCategory === category.title && (
                  <div className="px-4 pb-4 space-y-2">
                    {category.faqs.map((faq, index) => (
                      <FAQItem key={index} question={faq.question} answer={faq.answer} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 p-8 bg-muted/50 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">¿Necesitas más ayuda?</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            soporte@hc-gestor.com
          </Button>
          <Button variant="outline" className="gap-2">
            <Phone className="h-4 w-4" />
            (55) 1234-5678
          </Button>
          <Button variant="outline" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Chatear ahora
          </Button>
        </div>
      </div>
    </div>
  )
}
