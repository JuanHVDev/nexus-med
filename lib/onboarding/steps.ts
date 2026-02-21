import type { Step } from 'react-joyride'

export const tourSteps: Step[] = [
  {
    target: 'body',
    content:
      '👋 ¡Bienvenido a HC Gestor! Este tour te mostrará las funciones principales del sistema. Usa los botones para navegar.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar"]',
    content:
      '📋 Este es el menú lateral. Aquí encontrarás todas las secciones del sistema: Dashboard, Pacientes, Citas, Consultas, Facturación y más.',
    placement: 'right',
  },
  {
    target: '[data-tour="dashboard-stats"]',
    content:
      '📊 El Dashboard te muestra las estadísticas más importantes: citas de hoy, pacientes totales, ingresos del mes y más.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="patients"]',
    content:
      '👥 En Pacientes puedes registrar y gestionar todos los expedientes de tus pacientes. Cada paciente tiene su historial médico completo.',
    placement: 'right',
  },
  {
    target: '[data-tour="appointments"]',
    content:
      '📅 El calendario de citas te permite agendar, visualizar y gestionar las citas de todos los médicos de la clínica.',
    placement: 'right',
  },
  {
    target: '[data-tour="medical-notes"]',
    content:
      '📝 Aquí verás todas las notas médicas de las consultas. Cada nota incluye signos vitales, diagnóstico, tratamiento y más.',
    placement: 'right',
  },
  {
    target: '[data-tour="billing"]',
    content:
      '💰 La sección de Facturación gestiona las facturas, pagos y servicios de la clínica.',
    placement: 'right',
  },
  {
    target: '[data-tour="settings"]',
    content:
      '⚙️ En Configuración puedes gestionar la clínica, médicos, usuarios, horarios y más.',
    placement: 'right',
  },
  {
    target: '[data-tour="help-button"]',
    content:
      '❓ Si necesitas ayuda en cualquier momento, haz clic en este botón de ayuda. ¡Eso es todo! 🎉',
    placement: 'left',
  },
]

export const getStepsForRole = (role: string): Step[] => {
  const roleSpecificSteps: Partial<Record<string, Step[]>> = {
    DOCTOR: [
      {
        target: '[data-tour="quick-actions"]',
        content: 'Acciones rápidas: Nueva consulta, nueva receta, agendar cita.',
        placement: 'bottom',
      },
    ],
    RECEPTIONIST: [
      {
        target: '[data-tour="quick-actions"]',
        content: 'Acciones rápidas: Nuevo paciente, nueva cita, buscar paciente.',
        placement: 'bottom',
      },
    ],
    ADMIN: [
      {
        target: '[data-tour="reports"]',
        content: 'Reportes: Estadísticas completas de la clínica.',
        placement: 'left',
      },
    ],
  }

  return [...tourSteps, ...(roleSpecificSteps[role] || [])]
}
