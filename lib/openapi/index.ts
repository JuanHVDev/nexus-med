export const openApiVersion = "3.0.3"
export const apiTitle = "HC Gestor API"
export const apiVersion = "1.0.0"
export const apiDescription = `
Sistema de Gestión de Historias Clínicas Electrónicas (HCE)

## Autenticación
La API utiliza cookies de sesión para autenticación. Inicia sesión mediante el endpoint \`/api/auth/signin\` o el formulario en \`/login\`.

## Roles
- **ADMIN**: Acceso total a la clínica
- **DOCTOR**: Notas médicas, recetas, órdenes
- **NURSE**: Acceso limitado a pacientes y citas
- **RECEPTIONIST**: Gestión de citas y facturación
- **PATIENT**: Portal del paciente

## Cumplimiento
Este sistema cumple con la NOM-024-SSA3 para expedientes clínicos electrónicos de México.

## Rate Limiting
- 10 requests por minuto por IP
`

export const apiServer = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export const apiTags = [
  { name: "Auth", description: "Endpoints de autenticación" },
  { name: "Patients", description: "Gestión de pacientes" },
  { name: "Appointments", description: "Gestión de citas médicas" },
  { name: "Medical Notes", description: "Notas médicas y consultas" },
  { name: "Prescriptions", description: "Recetas electrónicas" },
  { name: "Lab Orders", description: "Órdenes de laboratorio" },
  { name: "Imaging Orders", description: "Órdenes de imagenología" },
  { name: "Billing", description: "Facturación y pagos" },
  { name: "Reports", description: "Reportes y exportaciones" },
  { name: "Settings", description: "Configuración del sistema" },
  { name: "Portal", description: "Portal del paciente" },
] as const

export type ApiTag = (typeof apiTags)[number]["name"]
