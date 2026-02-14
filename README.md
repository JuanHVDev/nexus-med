 HC Gestor - Sistema de Historia Clínica
Sistema completo de gestión clínica para clínicas medianas (6-20 médicos). Desarrollado con Next.js 16, TypeScript, PostgreSQL y Better-Auth.
 🚀 Características
- **Expediente Electrónico**: Gestión completa de pacientes y historial médico
- **Agenda Médica**: Sistema de citas con calendario interactivo
- **Notas Médicas**: Consultas con signos vitales y diagnósticos (CIE-10)
- **Recetas Electrónicas**: Generación de PDF con firma digital
- **Facturación**: Control de servicios, cobros y pagos
- **Multi-tenant**: Soporte para múltiples clínicas
- **Roles y Permisos**: Admin, Doctor, Enfermera, Recepcionista
- **Cumplimiento NOM-024-SSA3**: Listo para normativa mexicana
 🛠️ Stack Tecnológico
- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript 5
- **Base de Datos**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Autenticación**: Better-Auth
- **UI**: Tailwind CSS + shadcn/ui
- **Estado**: Zustand
- **Data Fetching**: TanStack Query
- **Validación**: Zod
 📋 Requisitos Previos
- Node.js 20+
- pnpm 9+
- Cuenta en Neon (PostgreSQL)
- Git
 🚀 Instalación Local
 1. Clonar repositorio
git clone <tu-repo>
cd hc-gestor
2. Instalar dependencias
pnpm install
3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales
4. Configurar base de datos
# Generar cliente Prisma
pnpm prisma generate
# Ejecutar migraciones
pnpm prisma migrate dev
# Cargar datos de prueba
pnpm prisma db seed
5. Iniciar servidor de desarrollo
pnpm dev
Abrir http://localhost:3000 (http://localhost:3000)
🔑 Credenciales de Prueba
Después de ejecutar el seed:
- Email: admin@clinica.com
- Password: Admin123!
📁 Estructura del Proyecto
src/
├── app/
│   ├── (auth)/          # Rutas de autenticación (login/register)
│   ├── (dashboard)/     # Rutas protegidas del dashboard
│   │   ├── dashboard/   # Página principal
│   │   ├── patients/    # Gestión de pacientes
│   │   ├── appointments/# Calendario y citas
│   │   └── ...
│   └── api/             # API Routes
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   └── dashboard/       # Componentes específicos del dashboard
├── lib/
│   ├── auth.ts          # Configuración Better-Auth
│   ├── auth-client.ts   # Cliente de autenticación
│   ├── prisma.ts        # Cliente Prisma
│   └── utils.ts         # Utilidades
├── hooks/               # Custom React hooks
├── store/               # Zustand stores
└── types/               # TypeScript types
🧪 Scripts Disponibles
- pnpm dev - Servidor de desarrollo
- pnpm build - Build de producción
- pnpm start - Iniciar servidor de producción
- pnpm lint - Ejecutar ESLint
- pnpm typecheck - Verificar tipos de TypeScript
- pnpm prisma generate - Generar cliente Prisma
- pnpm prisma migrate dev - Ejecutar migraciones
- pnpm prisma db seed - Cargar datos de prueba
🚢 Despliegue
El proyecto está configurado para desplegar en Vercel:
1. Conectar repositorio a Vercel
2. Configurar variables de entorno en Vercel Dashboard
3. Deploy automático con Git push
📄 Licencia
Privado - Todos los derechos reservados
🤝 Soporte
Para dudas o soporte, contactar al equipo de desarrollo.