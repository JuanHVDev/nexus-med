# HC Gestor - Sistema de Historia Clínica Electrónica

Sistema completo de gestión clínica para clínicas medianas (6-20 médicos). Desarrollado con Next.js 16, TypeScript, PostgreSQL y Better-Auth. Cumple con NOM-024-SSA3 para expedientes clínicos electrónicos en México.

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![License](https://img.shields.io/badge/License-Private-red)

---

## Características Principales

### Gestión de Pacientes
- Expediente electrónico completo con foto del paciente
- Validación automática de CURP
- Historial médico, contactos de emergencia
- Búsqueda avanzada y filtros
- Soft delete con restauración

### Sistema de Citas
- Calendario interactivo (vista mensual/semanal/diaria)
- Drag & drop para reagendar
- Estados: Programada, Confirmada, En curso, Completada, Cancelada, No asistió
- Recordatorios por email

### Notas Médicas
- 10 plantillas por especialidad:
  - Medicina General, Pediatría, Ginecología, Cardiología
  - Dermatología, Oftalmología, Otorrinolaringología, Traumatología
  - Psiquiatría, Neurología
- Signos vitales con gráficas de tendencias
- Diagnósticos CIE-10
- Antecedentes heredofamiliares

### Recetas Electrónicas
- Generación de PDF profesional
- Múltiples medicamentos con indicaciones
- Historial de recetas por paciente
- Impresión directa

### Facturación
- Facturas con múltiples conceptos
- Registro de pagos parciales/totales
- Estados: Pendiente, Parcial, Pagada, Cancelada
- Exportación a PDF
- Resumen financiero

### Laboratorio e Imagenología
- Órdenes de laboratorio con múltiples estudios
- Captura de resultados con valores de referencia
- Órdenes de imagenología (Rayos X, Ultrasonido, etc.)
- Liberación de resultados desde el portal

### Portal del Paciente
- Acceso para pacientes con su propio login
- Solicitud de citas
- Consulta de resultados de laboratorio
- Descarga de recetas
- Historial médico
- Facturas

### Reportes y Análisis
- Reporte de Pacientes (distribución por género, tipo de sangre, edad)
- Reporte de Citas (tasa de asistencia, distribución por médico)
- Reporte Financiero (ingresos, facturas por estado)
- Reporte de Consultas (top diagnósticos, especialidades)
- Exportación a PDF y Excel con gráficas

### Auditoría y Seguridad
- Log de todas las acciones (creación, lectura, actualización, eliminación)
- Rastreo de exportaciones y generación de PDFs
- Filtrado por usuario, acción, fecha
- Cumplimiento NOM-024-SSA3

---

## Stack Tecnológico

### Frontend & Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 16.1.6 | Framework React (App Router) |
| React | 19.2.3 | UI Library |
| TypeScript | 5.x | Type Safety |
| Tailwind CSS | v4 | Styling |
| shadcn/ui | - | Componentes accesibles |
| Framer Motion | 12.x | Animaciones |
| TanStack Query | 5.x | Data fetching |
| Zustand | 5.x | Estado global |

### Backend & Database
| Tecnología | Propósito |
|------------|-----------|
| Prisma | ORM con 25+ modelos |
| PostgreSQL (Neon) | Base de datos |
| Redis (Upstash) | Cache + Sesiones |
| Better-Auth | Autenticación completa |

### Servicios Externos
| Servicio | Propósito |
|----------|-----------|
| Resend | Email transaccionales |
| Vercel Blob | Almacenamiento de archivos |
| Vercel Analytics | Métricas de uso |
| Vercel Speed Insights | Performance |

### Testing
| Herramienta | Propósito |
|-------------|-----------|
| Vitest | Unit tests (373 tests) |
| Playwright | E2E tests |
| Artillery | Load testing |

---

## Diseño

### Design System "Serum & Glass"
- Paleta OKLCH con tema claro/oscuro
- Glassmorphism en cards y componentes
- Tipografía: Instrument Serif + Plus Jakarta Sans + Geist Mono
- Animaciones staggered con Framer Motion
- Bento Grid layout en dashboard

### Características de UI
- 100% responsive (mobile-first)
- Dark mode con persistencia
- Loading skeletons
- Error boundaries por sección
- Tooltips y guías de tour

---

## Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **Admin** | Acceso total, gestión de usuarios, configuración |
| **Doctor** | Pacientes, citas, notas médicas, recetas, ver facturación |
| **Nurse** | Pacientes, citas, notas básicas, ver expedientes |
| **Receptionist** | Pacientes, citas, facturación |
| **Patient** | Portal del paciente (solo sus datos) |

---

## Requisitos Previos

- Node.js 20+
- pnpm 9+
- Cuenta en Neon (PostgreSQL)
- Cuenta en Upstash (Redis)
- Cuenta en Resend (Email)
- Cuenta en Vercel (Deploy + Blob Storage)

---

## Instalación Local

```bash
# 1. Clonar repositorio
git clone <tu-repo>
cd hc-gestor

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Configurar base de datos
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed

# 5. Iniciar servidor
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## Variables de Entorno

```bash
# Base de datos
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Better-Auth
BETTER_AUTH_SECRET="generar-con-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_xxxxx"

# Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN="vercel_blob_xxxxx"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://xxxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxxxx"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Estructura del Proyecto

```
hc-gestor/
├── app/
│   ├── (auth)/              # Login, registro, verificación
│   ├── (dashboard)/         # Panel principal protegido
│   │   ├── dashboard/       # Estadísticas y métricas
│   │   ├── patients/        # Gestión de pacientes
│   │   ├── appointments/    # Calendario de citas
│   │   ├── consultations/   # Notas médicas
│   │   ├── prescriptions/   # Recetas
│   │   ├── billing/         # Facturación
│   │   ├── lab-orders/      # Laboratorio
│   │   ├── imaging-orders/  # Imagenología
│   │   ├── reports/         # Reportes
│   │   └── settings/        # Configuración
│   ├── (patient-portal)/    # Portal del paciente
│   ├── api/                 # 50+ API endpoints
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── invoices/
│   │   ├── medical-notes/
│   │   └── ...
│   ├── sitemap.ts           # SEO dinámico
│   └── robots.ts            # Robots.txt
├── components/
│   ├── ui/                  # Componentes shadcn/ui
│   ├── dashboard/           # Sidebar, stats
│   ├── patients/            # Componentes pacientes
│   ├── appointments/        # Calendario, formularios
│   ├── billing/             # Facturas, PDFs
│   ├── medical-notes/       # Notas por especialidad
│   └── providers/           # Context providers
├── lib/
│   ├── domain/              # Servicios de dominio (7)
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── invoices/
│   │   └── ...
│   ├── validations/         # Schemas Zod
│   ├── audit/               # Sistema de auditoría
│   ├── email/               # Servicio de email
│   ├── cache.ts             # Redis caching
│   ├── auth.ts              # Better-Auth config
│   └── prisma.ts            # Prisma client
├── prisma/
│   ├── schema.prisma        # 25+ modelos
│   ├── seed.ts              # Datos de prueba
│   └── migrations/
├── tests/
│   ├── unit/                # Tests unitarios
│   ├── integration/         # Tests integración
│   └── e2e/                 # Tests Playwright
└── public/
    └── images/              # Assets estáticos
```

---

## Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Servidor de desarrollo (Turbopack)
pnpm lint             # ESLint
pnpm typecheck        # TypeScript check

# Testing
pnpm test             # Unit tests (Vitest)
pnpm test:run         # Tests una vez
pnpm test:coverage    # Coverage report
pnpm test:integration # Integration tests
pnpm test:e2e         # E2E tests (Playwright)
pnpm test:load        # Load tests (Artillery)

# Base de datos
pnpm prisma generate  # Generar cliente
pnpm prisma migrate   # Migraciones
pnpm prisma studio    # GUI de base de datos
pnpm prisma seed      # Datos de prueba

# Producción
pnpm build            # Build optimizado
pnpm start            # Servidor producción
```

---

## API Endpoints

El proyecto incluye 50+ endpoints REST:

| Módulo | Endpoints |
|--------|-----------|
| Auth | `/api/auth/*`, `/api/auth/register` |
| Patients | CRUD + emergency contacts + history + notes |
| Appointments | CRUD + calendar |
| Medical Notes | CRUD por especialidad |
| Prescriptions | CRUD |
| Invoices | CRUD + payments |
| Lab Orders | CRUD + results |
| Imaging Orders | CRUD |
| Reports | patients, appointments, financial, medical |
| Settings | clinic, team, doctors, hours |
| Portal | auth, appointments, results, contact |

Documentación completa en `/api/docs` (OpenAPI).

---

## Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Archivos TypeScript/TSX | 179+ |
| Páginas App Router | 52 |
| API Endpoints | 50+ |
| Modelos Prisma | 25+ |
| Tests Unitarios | 373 |
| Cobertura de Testing | 99% |
| Domain Services | 7 |

---

## Despliegue

El proyecto está optimizado para Vercel:

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático con cada push a main

### Configuración de Producción

```bash
# Variables adicionales para producción
BETTER_AUTH_URL="https://tu-dominio.com"
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
```

---

## Seguridad

- Security Headers (CSP, X-Frame-Options, etc.)
- Rate limiting en API endpoints
- Validación con Zod en todos los inputs
- Autenticación con Better-Auth + sesiones Redis
- Soft delete de datos sensibles
- Auditoría completa de acciones

---

## Licencia

Privado - Todos los derechos reservados

---

## Soporte

Para dudas o soporte técnico, contactar al equipo de desarrollo.
